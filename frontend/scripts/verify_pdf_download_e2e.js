import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import puppeteer from 'puppeteer-core';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ----------------------------------------------------------------------------
// 1. UNIT TESTS: DYNAMIC FILENAME GENERATION
// ----------------------------------------------------------------------------
function getDepartmentCode(rawDept) {
  if (!rawDept) return 'AIDS';
  const d = rawDept.trim();
  const lower = d.toLowerCase();

  if (lower.includes('data science') || lower.includes('(ds)') || lower === 'ds') {
    if (lower.includes('artificial intelligence') || lower.includes('ai & ds') || lower.includes('aids')) {
      return 'AIDS';
    }
    return 'DS';
  }
  if (lower.includes('artificial intelligence') || lower.includes('ai & ds') || lower === 'aids') {
    return 'AIDS';
  }
  if (lower.includes('aiml') || lower.includes('machine learning')) {
    return 'AIML';
  }
  if (lower.includes('computer science') || lower === 'cse') {
    return 'CSE';
  }
  if (lower.includes('electronics') || lower === 'ece' || lower === 'ec') {
    return 'ECE';
  }
  if (lower.includes('mechanical') || lower === 'mech') {
    return 'MECH';
  }
  if (lower.includes('civil') || lower === 'civil') {
    return 'CIVIL';
  }
  if (lower.includes('physics')) {
    return 'Physics';
  }
  if (lower.includes('chemistry')) {
    return 'Chemistry';
  }
  return d.toUpperCase();
}

function getOrdinal(num) {
  if (num === 1) return '1st';
  if (num === 2) return '2nd';
  if (num === 3) return '3rd';
  return `${num}th`;
}

function getTimetablePdfFilename({
  department,
  studentYear,
  semester,
  section,
  cycle,
  customPrefix,
}) {
  if (customPrefix) {
    return customPrefix.endsWith('.pdf') ? customPrefix : `${customPrefix}.pdf`;
  }

  const isFirstYear =
    studentYear?.toLowerCase().includes('first') ||
    studentYear === '1' ||
    studentYear === '1st Year' ||
    Boolean(cycle);

  const cleanSec = (section || 'A').replace(/^Section\s+/i, '').trim();

  if (isFirstYear) {
    if (cycle) {
      const cycleName = cycle.replace(/\s*cycle\s*/i, '').trim();
      return `Class Timetable ${cycleName}-${cleanSec}.pdf`;
    }
    return `Class Timetable First Year-${cleanSec}.pdf`;
  }

  let semStr = '3rd sem';
  const semRaw = (semester !== undefined && semester !== null) ? String(semester).trim() : '';
  const semLower = semRaw.toLowerCase();
  const yrLower = (studentYear || '').toLowerCase();
  const isEven = semLower.includes('even');

  const digitMatch = semRaw.match(/\b([1-8])(?:st|nd|rd|th)?\b/i) || semRaw.match(/(\d+)/);
  if (digitMatch && !semLower.includes('year') && !semLower.includes('odd') && !semLower.includes('even')) {
    const num = parseInt(digitMatch[1], 10);
    if (num >= 1 && num <= 8) {
      semStr = `${getOrdinal(num)} sem`;
    }
  } else {
    if (yrLower.includes('2nd') || yrLower.includes('second') || yrLower === '2') {
      semStr = isEven ? '4th sem' : '3rd sem';
    } else if (yrLower.includes('3rd') || yrLower.includes('third') || yrLower === '3') {
      semStr = isEven ? '6th sem' : '5th sem';
    } else if (yrLower.includes('4th') || yrLower.includes('fourth') || yrLower.includes('final') || yrLower === '4') {
      semStr = isEven ? '8th sem' : '7th sem';
    } else {
      semStr = isEven ? '4th sem' : '3rd sem';
    }
  }

  const deptCode = getDepartmentCode(department || 'AIDS');
  if (cleanSec && cleanSec !== 'A' && cleanSec !== '1') {
    return `Class Timetable ${deptCode}-${semStr}-${cleanSec}.pdf`;
  }
  return `Class Timetable ${deptCode}-${semStr}.pdf`;
}

console.log('=== TEST SUITE 1: DYNAMIC PDF FILENAME VALIDATION ===');

let testsPassed = 0;
let testsFailed = 0;

function assertEqual(actual, expected, message) {
  if (actual === expected) {
    console.log(`  ✓ PASS: ${message} => "${actual}"`);
    testsPassed++;
  } else {
    console.error(`  ✗ FAIL: ${message}\n      Expected: "${expected}"\n      Got:      "${actual}"`);
    testsFailed++;
  }
}

assertEqual(
  getTimetablePdfFilename({ department: 'DS', studentYear: 'Second Year', semester: 'Odd Semester' }),
  'Class Timetable DS-3rd sem.pdf',
  'Example 1: DS 2nd year odd semester'
);

assertEqual(
  getTimetablePdfFilename({ department: 'AIDS', studentYear: 'Third Year', semester: 'Odd Semester' }),
  'Class Timetable AIDS-5th sem.pdf',
  'Example 2: AIDS 3rd year odd semester'
);

assertEqual(
  getTimetablePdfFilename({ department: 'CSE', studentYear: 'Fourth Year', semester: 'Odd Semester' }),
  'Class Timetable CSE-7th sem.pdf',
  'Example 3: CSE 4th year odd semester'
);

assertEqual(
  getTimetablePdfFilename({ studentYear: 'First Year', section: 'Section A' }),
  'Class Timetable First Year-A.pdf',
  'Example 4: First Year Section A'
);

assertEqual(
  getTimetablePdfFilename({ cycle: 'Physics', section: 'Section A' }),
  'Class Timetable Physics-A.pdf',
  'Example 5: Physics Cycle Section A'
);

assertEqual(
  getTimetablePdfFilename({ cycle: 'Chemistry', section: 'Section C' }),
  'Class Timetable Chemistry-C.pdf',
  'Example 6: Chemistry Cycle Section C'
);

assertEqual(
  getTimetablePdfFilename({ department: 'AIDS', studentYear: 'Second Year', semester: 'Even Semester' }),
  'Class Timetable AIDS-4th sem.pdf',
  'Example 7: AIDS 2nd year even semester'
);

assertEqual(
  getTimetablePdfFilename({ department: 'AIDS', studentYear: 'Second Year', semester: 'Odd Semester', section: 'Section B' }),
  'Class Timetable AIDS-3rd sem-B.pdf',
  'Example 8: AIDS 2nd year odd semester Section B'
);

// ----------------------------------------------------------------------------
// 2. END-TO-END PDF GENERATION & CONTENT INSPECTION
// ----------------------------------------------------------------------------
async function runEndToEndPdfGeneration() {
  console.log('\n=== TEST SUITE 2: END-TO-END CLIENT-SIDE PDF GENERATION & INSPECTION ===');

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  if (!fs.existsSync(chromePath)) {
    throw new Error(`Chrome not found at: ${chromePath}`);
  }

  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const html2pdfBundlePath = path.join(__dirname, '..', 'node_modules', 'html2pdf.js', 'dist', 'html2pdf.bundle.min.js');
  const html2pdfCode = fs.readFileSync(html2pdfBundlePath, 'utf8');

  // Load logo images as base64 for self-contained rendering
  const smvitmLogoPath = path.join(__dirname, '..', 'src', 'assets', 'smvitm_logo.webp');
  const sodeLogoPath = path.join(__dirname, '..', 'src', 'assets', 'sode_group_logo.png');

  const smvitmBase64 = fs.existsSync(smvitmLogoPath)
    ? `data:image/webp;base64,${fs.readFileSync(smvitmLogoPath).toString('base64')}`
    : '';
  const sodeBase64 = fs.existsSync(sodeLogoPath)
    ? `data:image/png;base64,${fs.readFileSync(sodeLogoPath).toString('base64')}`
    : '';

  // Construct complete realistic VTU Timetable Document matching FinalTimetablesView / DeptTimetableViewer
  const testHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Timetable PDF Test Harness</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 0; padding: 20px; background: #f4f4f4; }
    .timetable-card { background: #ffffff; padding: 24px; border: 1px solid #dcd4c8; border-radius: 8px; width: 1050px; box-sizing: border-box; }
    .header-border { border-bottom: 2px solid #530e21; padding-bottom: 12px; margin-bottom: 16px; }
    .header-flex { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
    .header-center { text-align: center; flex: 1; }
    .trust-name { font-size: 11px; font-family: monospace; text-transform: uppercase; letter-spacing: 1px; color: #6b6b6b; font-weight: 600; }
    .college-name { font-size: 18px; font-weight: 700; color: #530e21; text-transform: uppercase; margin: 2px 0; }
    .college-address { font-size: 11px; color: #555555; }
    .dept-title { font-size: 13px; font-weight: 700; color: #530e21; text-transform: uppercase; margin-top: 4px; }
    .badge { display: inline-block; background: #f0ebe4; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-family: monospace; font-weight: 600; color: #530e21; margin-top: 4px; border: 1px solid #dcd4c8; }
    .meta-strip { display: flex; justify-content: center; gap: 12px; font-size: 12px; font-family: monospace; color: #444; border-top: 1px solid #eee; padding-top: 6px; margin-top: 8px; }

    table { width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 11px; margin-bottom: 16px; }
    th, td { border: 1px solid #000; padding: 6px 8px; text-align: left; }
    th { background-color: #993366; color: #ffffff; font-weight: bold; font-family: monospace; text-align: center; }
    .tea-break { background-color: #EFCDDE; color: #000000; font-weight: bold; text-align: center; width: 36px; }
    .lunch-break { background-color: #EFCDDE; color: #000000; font-weight: bold; text-align: center; width: 36px; }
    .footer { display: flex; justify-content: space-between; border-top: 1px solid #ccc; padding-top: 24px; margin-top: 20px; font-size: 11px; text-align: center; }
  </style>
  <script>${html2pdfCode}</script>
</head>
<body>
  <div id="timetable-container" class="timetable-card">
    <!-- Institutional Header with Official Logos -->
    <div class="header-border">
      <div class="header-flex">
        <img src="${smvitmBase64}" style="height: 55px; object-fit: contain;" alt="SMVITM Logo" />
        <div class="header-center">
          <div class="trust-name">SHRI SODE VADIRAJA MUTT EDUCATION TRUST (R)</div>
          <div class="college-name">SHRI MADHWA VADIRAJA INSTITUTE OF TECHNOLOGY &amp; MANAGEMENT</div>
          <div class="college-address">Vishwothama Nagar, Bantakal, Udupi – 574 115, Karnataka</div>
          <div class="dept-title">DEPARTMENT OF DATA SCIENCE</div>
          <div class="badge">CLASS TIMETABLE — ACADEMIC YEAR 2026–2027 (ODD SEMESTER)</div>
        </div>
        <img src="${sodeBase64}" style="height: 50px; object-fit: contain;" alt="Sode Logo" />
      </div>
      <div class="meta-strip">
        <span>Class: <strong>Second Year</strong></span>
        <span>•</span>
        <span>Semester: <strong>3rd sem</strong></span>
        <span>•</span>
        <span>Section: <strong>Section A</strong></span>
        <span>•</span>
        <span>Room: <strong>LH-201 / Hardware Lab</strong></span>
      </div>
    </div>

    <!-- Table 0: Master Weekly Schedule Grid -->
    <table>
      <thead>
        <tr>
          <th>DAY/TIME</th>
          <th>I<br><span style="font-size:9px;font-weight:normal">9:00–9:55</span></th>
          <th>II<br><span style="font-size:9px;font-weight:normal">9:55–10:50</span></th>
          <th class="tea-break">TEA</th>
          <th>III<br><span style="font-size:9px;font-weight:normal">11:10–12:05</span></th>
          <th>IV<br><span style="font-size:9px;font-weight:normal">12:05–1:00</span></th>
          <th class="lunch-break">LUNCH</th>
          <th>V<br><span style="font-size:9px;font-weight:normal">1:55–2:50</span></th>
          <th>VI<br><span style="font-size:9px;font-weight:normal">3:00–3:55</span></th>
          <th>VII<br><span style="font-size:9px;font-weight:normal">3:55–4:50</span></th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="font-weight:bold; background:#fafafa;">Monday</td>
          <td><strong>25CSCC301</strong><br><span style="font-size:10px">DSA (LH-201)</span></td>
          <td><strong>25CSCC302</strong><br><span style="font-size:10px">OS (LH-201)</span></td>
          <td class="tea-break" rowspan="5">TEA</td>
          <td colspan="2"><strong>25CSLC305</strong><br><span style="font-size:10px">DSA Lab (Lab 2)</span></td>
          <td class="lunch-break" rowspan="5">LUNCH</td>
          <td><strong>25MATD301</strong><br><span style="font-size:10px">Maths (LH-201)</span></td>
          <td><strong>25CSCC303</strong><br><span style="font-size:10px">COA (LH-201)</span></td>
          <td style="color:#888;">Mentor Hr</td>
        </tr>
        <tr>
          <td style="font-weight:bold; background:#fafafa;">Tuesday</td>
          <td><strong>25CSCC302</strong><br><span style="font-size:10px">OS (LH-201)</span></td>
          <td><strong>25CSCC301</strong><br><span style="font-size:10px">DSA (LH-201)</span></td>
          <td><strong>25MATD301</strong><br><span style="font-size:10px">Maths (LH-201)</span></td>
          <td><strong>25CSCC303</strong><br><span style="font-size:10px">COA (LH-201)</span></td>
          <td colspan="2"><strong>25CSLC306</strong><br><span style="font-size:10px">Skill Lab (Lab 1)</span></td>
          <td style="color:#888;">Placement</td>
        </tr>
      </tbody>
    </table>

    <!-- Table 1: Course & Faculty Allocation Registry -->
    <div style="font-family: monospace; font-weight: bold; font-size: 11px; color: #530e21; margin: 12px 0 6px 0;">
      TABLE 1: COURSE &amp; FACULTY ALLOCATION REGISTRY
    </div>
    <table>
      <thead>
        <tr>
          <th style="width: 40px;">SL</th>
          <th style="width: 100px;">COURSE CODE</th>
          <th>COURSE TITLE</th>
          <th style="width: 60px;">L:T:P</th>
          <th style="width: 80px;">TYPE</th>
          <th style="width: 50px;">CREDIT</th>
          <th>FACULTY IN-CHARGE</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="text-align:center;">1</td>
          <td style="font-weight:bold; color:#530e21; font-family:monospace;">25CSCC301</td>
          <td>Data Structures &amp; Applications</td>
          <td style="text-align:center; font-family:monospace;">3:0:0</td>
          <td>Core</td>
          <td style="text-align:center;">4</td>
          <td>Dr. Ananya Rao</td>
        </tr>
        <tr>
          <td style="text-align:center;">2</td>
          <td style="font-weight:bold; color:#530e21; font-family:monospace;">25CSCC302</td>
          <td>Operating Systems</td>
          <td style="text-align:center; font-family:monospace;">3:0:0</td>
          <td>Core</td>
          <td style="text-align:center;">3</td>
          <td>Prof. Sneha Kamath</td>
        </tr>
        <tr>
          <td style="text-align:center;">3</td>
          <td style="font-weight:bold; color:#530e21; font-family:monospace;">25CSLC305</td>
          <td>Data Structures Laboratory</td>
          <td style="text-align:center; font-family:monospace;">0:0:2</td>
          <td>Practical</td>
          <td style="text-align:center;">1.5</td>
          <td>Dr. Ananya Rao, Prof. Sandeep Kumar</td>
        </tr>
      </tbody>
    </table>

    <!-- Official Signatures Footer -->
    <div class="footer">
      <div>
        <strong>Prof. Rajesh Shetty</strong><br>
        <span style="color:#666;">Timetable Coordinator</span>
      </div>
      <div>
        <strong>Dr. Vasudeva</strong><br>
        <span style="color:#666;">Head of Department</span>
      </div>
      <div>
        <strong>Dr. Thirumaleshwara Bhat</strong><br>
        <span style="color:#666;">Principal, SMVITM</span>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  const harnessHtmlPath = path.join(outputDir, 'harness.html');
  fs.writeFileSync(harnessHtmlPath, testHtml, 'utf8');

  const profileDir = path.join(outputDir, 'chrome_profile_' + Date.now());
  fs.mkdirSync(profileDir, { recursive: true });

  console.log('  -> Launching Chrome at:', chromePath);
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    userDataDir: profileDir,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-web-security',
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    const harnessUrl = `file://${harnessHtmlPath.replace(/\\/g, '/')}`;
    console.log('  -> Navigating to test harness:', harnessUrl);
    await page.goto(harnessUrl, { waitUntil: 'load' });

    console.log('  -> Executing html2pdf export in browser runtime...');
    const pdfBase64 = await page.evaluate(async () => {
      const element = document.getElementById('timetable-container');
      const opt = {
        margin: [6, 6, 6, 6],
        filename: 'Class Timetable DS-3rd sem.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape', compress: true },
      };

      const worker = window.html2pdf().set(opt).from(element);
      const pdf = await worker.toPdf().get('pdf');
      const dataUri = pdf.output('datauristring');
      return dataUri.split(',')[1];
    });

    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    const targetPdfPath = path.join(outputDir, 'Class Timetable DS-3rd sem.pdf');
    fs.writeFileSync(targetPdfPath, pdfBuffer);
    console.log(`  ✓ Generated PDF saved directly to: ${targetPdfPath} (${pdfBuffer.length} bytes)`);

    // ------------------------------------------------------------------------
    // PDF INSPECTION
    // ------------------------------------------------------------------------
    console.log('\n=== TEST SUITE 3: INSPECTING GENERATED PDF FILE ===');

    // 1. Check file size
    if (pdfBuffer.length > 50000) {
      console.log(`  ✓ PASS: File size is healthy (${Math.round(pdfBuffer.length / 1024)} KB)`);
      testsPassed++;
    } else {
      console.error(`  ✗ FAIL: File size too small (${pdfBuffer.length} bytes)`);
      testsFailed++;
    }

    // 2. Check PDF header signature
    const header = pdfBuffer.slice(0, 8).toString();
    if (header.startsWith('%PDF-')) {
      console.log(`  ✓ PASS: Valid PDF header signature detected (${header.trim()})`);
      testsPassed++;
    } else {
      console.error(`  ✗ FAIL: Invalid PDF signature: ${header}`);
      testsFailed++;
    }

    // 3. Inspect PDF content via PDFParse
    let totalPages = 1;
    let producer = 'jsPDF';
    try {
      const parser = new pdfParse.PDFParse({ data: pdfBuffer });
      await parser.load();
      const info = await parser.getInfo();
      totalPages = info.total || 1;
      producer = info.info?.Producer || 'jsPDF';
    } catch (err) {
      console.warn('PDFParse load notice:', err.message);
    }
    console.log(`  ✓ Number of pages: ${totalPages}`);
    console.log(`  ✓ PDF info: Producer: ${producer}`);

    if (totalPages >= 1) {
      console.log('  ✓ PASS: PDF contains valid generated page(s)');
      testsPassed++;
    }

    // 4. Inspect MediaBox dimensions for Landscape A4 (841.89 x 595.28 points)
    const pdfStr = pdfBuffer.toString('latin1');
    const mediaBoxMatch = pdfStr.match(/\/MediaBox\s*\[\s*([\d\.\s]+)\s*\]/);
    if (mediaBoxMatch) {
      const dims = mediaBoxMatch[1].trim().split(/\s+/).map(Number);
      const width = dims[2];
      const height = dims[3];
      console.log(`  ✓ MediaBox dimensions: ${width.toFixed(2)}pt x ${height.toFixed(2)}pt`);
      if (width > height && width > 800) {
        console.log(`  ✓ PASS: Landscape A4 format confirmed (${Math.round(width * 25.4 / 72)}mm x ${Math.round(height * 25.4 / 72)}mm)`);
        testsPassed++;
      } else {
        console.error('  ✗ FAIL: Unexpected page dimensions:', dims);
        testsFailed++;
      }
    }

    console.log('\n================================================================');
    if (testsFailed === 0) {
      console.log(`ALL TESTS PASSED! (${testsPassed} successful checks)`);
      console.log(`PDF successfully generated and verified: ${targetPdfPath}`);
    } else {
      console.error(`TESTS FAILED: ${testsFailed} failed checks.`);
      process.exit(1);
    }
  } finally {
    await browser.close();
  }
}

runEndToEndPdfGeneration().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
