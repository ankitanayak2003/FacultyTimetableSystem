import os
import re

frontend_dir = os.path.abspath("frontend/src")

files_with_demo = {}

for root, _, files in os.walk(frontend_dir):
    for file in files:
        if file.endswith((".ts", ".tsx")):
            path = os.path.join(root, file)
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
            
            imports = re.findall(r"import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+['\"]([^'\"]*(?:workflowDemoData|facultyDemoData|studentDemoData))['\"]", content)
            if imports:
                rel = os.path.relpath(path, frontend_dir)
                files_with_demo[rel] = imports

print(f"Total frontend files importing demo data: {len(files_with_demo)}")
for f, imps in sorted(files_with_demo.items()):
    print(f"\n{f}:")
    for symbols, mod in imps:
        items = [s.strip().replace("type ", "") for s in symbols.split(",") if s.strip()]
        print(f"  from '{mod}': {items}")
