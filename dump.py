import os
from docx import Document

print("Creating Project Codebase Dump...")
EXCLUDE_DIRS = {'node_modules', '.git', '.next', 'ieee_paper', 'dist', 'build', 'figures', 'venv', '__pycache__', '.vscode'}
EXCLUDE_EXTS = {'.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.mp4', '.pdf', '.docx', '.zip', '.pyc', '.pyo', '.webm'}

with open('CodeSonar_Codebase_Dump.txt', 'w', encoding='utf-8') as outfile:
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        for file in files:
            if any(file.endswith(ext) for ext in EXCLUDE_EXTS) or file in ['CodeSonar_Codebase_Dump.txt', 'dump.py', 'package-lock.json', 'CodeSonar_IEEE_Paper.txt']:
                continue
            path = os.path.join(root, file)
            outfile.write(f"\n\n{'='*80}\n")
            outfile.write(f"FILE: {path}\n")
            outfile.write(f"{'='*80}\n\n")
            try:
                with open(path, 'r', encoding='utf-8') as infile:
                    outfile.write(infile.read())
            except Exception as e:
                pass
print("Created: CodeSonar_Codebase_Dump.txt")

try:
    print("Creating IEEE Paper Text Dump...")
    doc = Document(r"r:\dup\codesonar\ieee_paper\CodeSonar_IEEE_Paper.docx")
    with open("CodeSonar_IEEE_Paper.txt", "w", encoding="utf-8") as f:
        for p in doc.paragraphs:
            if p.text.strip():
                f.write(p.text + "\n")
    print("Created: CodeSonar_IEEE_Paper.txt")
except Exception as e:
    print(f"Failed to read docx: {e}")
