import asyncio
import json
import os
import subprocess
import time
import urllib.request
import websockets

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = 9333
PROFILE_DIR = os.path.abspath(r"C:\Users\ankita\.gemini\antigravity\brain\b92e1868-20a6-4c2c-984a-7b7f208cb116\scratch\chrome_profile")

async def send_cdp(ws, method, params=None, msg_id=[1]):
    mid = msg_id[0]
    msg_id[0] += 1
    msg = {"id": mid, "method": method, "params": params or {}}
    await ws.send(json.dumps(msg))
    while True:
        resp = json.loads(await ws.recv())
        if resp.get("id") == mid:
            return resp.get("result", {})

async def eval_js(ws, expr, msg_id=[1000]):
    res = await send_cdp(ws, "Runtime.evaluate", {"expression": expr, "returnByValue": True}, msg_id)
    return res.get("result", {}).get("value")

async def run_verification():
    os.makedirs(PROFILE_DIR, exist_ok=True)
    chrome_proc = subprocess.Popen([
        CHROME_PATH,
        f"--remote-debugging-port={PORT}",
        f"--user-data-dir={PROFILE_DIR}",
        "--headless=new",
        "--disable-gpu",
        "about:blank"
    ])
    print(f"Started headless Chrome (PID {chrome_proc.pid}) on port {PORT}...", flush=True)
    await asyncio.sleep(2)

    try:
        # Get Page target from /json/list or /json/new
        list_url = f"http://127.0.0.1:{PORT}/json/list"
        req = urllib.request.Request(list_url)
        with urllib.request.urlopen(req, timeout=5) as r:
            targets = json.loads(r.read().decode())
        
        page_target = next((t for t in targets if t.get("type") == "page"), None)
        if not page_target:
            # create new page
            new_url = f"http://127.0.0.1:{PORT}/json/new"
            with urllib.request.urlopen(urllib.request.Request(new_url, data=b""), timeout=5) as r:
                page_target = json.loads(r.read().decode())
        
        ws_url = page_target.get("webSocketDebuggerUrl")
        print(f"Connecting to Page CDP: {ws_url}", flush=True)

        async with websockets.connect(ws_url) as ws:
            msg_id = [1]
            await send_cdp(ws, "Page.enable", msg_id=msg_id)
            await send_cdp(ws, "Runtime.enable", msg_id=msg_id)

            # Navigate to frontend
            print("Navigating to http://127.0.0.1:5173/ ...", flush=True)
            await send_cdp(ws, "Page.navigate", {"url": "http://127.0.0.1:5173/"}, msg_id=msg_id)
            await asyncio.sleep(4)

            # 1. Header & Scramble Animation check
            header_text = await eval_js(ws, "document.body.innerText", msg_id=msg_id)
            print("\n=== Initial Page Load Text Preview ===", flush=True)
            print(header_text[:400] if header_text else "No text found", flush=True)

            # Check if tagline contains official words
            tagline_check = await eval_js(ws, """
                (() => {
                    const t = document.body.innerText;
                    return {
                        has_header: t.includes('Academic Quality & Scheduling') || t.includes('AQS'),
                        has_vtu_header: t.includes('Shri Madhwa Vadiraja Institute') || t.includes('SMVITM'),
                        has_scramble_words: t.includes('Academic Hour') || t.includes('Purpose') || t.includes('Rhythm') || t.includes('Where Every'),
                    };
                })()
            """, msg_id=msg_id)
            print(f"Tagline / Header check: {tagline_check}", flush=True)

            # Check for API offline warning
            offline_warning = await eval_js(ws, "document.body.innerText.includes('FastAPI server offline')", msg_id=msg_id)
            print(f"Offline Warning Shown: {offline_warning}", flush=True)

            # Click Sign In on Faculty / Coordinator role
            # Let's inspect submit button
            login_result = await eval_js(ws, """
                (() => {
                    const submitBtn = document.querySelector('button[type="submit"]');
                    if (submitBtn) {
                        submitBtn.click();
                        return "Clicked submit: " + submitBtn.innerText;
                    }
                    return "Submit button not found";
                })()
            """, msg_id=msg_id)
            print(f"Login action: {login_result}", flush=True)
            await asyncio.sleep(3)

            # Check post-login page content
            post_login_text = await eval_js(ws, "document.body.innerText", msg_id=msg_id)
            print("\n=== Post-Login Text Preview ===", flush=True)
            print(post_login_text[:500] if post_login_text else "No text", flush=True)

            # Verify Firestore live data in DOM
            live_data_audit = await eval_js(ws, """
                (() => {
                    const text = document.body.innerText;
                    // Check live Firestore values
                    const departments = ['Artificial Intelligence', 'Computer Science', 'Civil', 'Mechanical', 'Basic Science', 'Mathematics'];
                    const facultyNames = ['Dr. Tejaswini H', 'Dr. Ananya Rao', 'Dr. Vasudeva', 'Dr. Radhakrishna', 'Dr. Sudarshan Rao'];
                    const subjects = ['25CSCC310', '25MACC311', '25CSIP320', 'Operating Systems', 'Data Structures', 'Database'];
                    const rooms = ['LH-101', 'CR-201', 'AL-101'];

                    return {
                        matched_departments: departments.filter(d => text.includes(d)),
                        matched_faculty: facultyNames.filter(f => text.includes(f)),
                        matched_subjects: subjects.filter(s => text.includes(s)),
                        matched_rooms: rooms.filter(r => text.includes(r)),
                        total_length: text.length
                    };
                })()
            """, msg_id=msg_id)
            print("\n=== Live Data Audit in UI ===", flush=True)
            print(json.dumps(live_data_audit, indent=2), flush=True)

    finally:
        chrome_proc.terminate()
        print("Terminated Chrome headless process.", flush=True)

if __name__ == "__main__":
    asyncio.run(run_verification())
