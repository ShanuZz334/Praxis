import os
import glob
import re

history_path = os.path.expandvars(r'%APPDATA%\Code\User\History')
print(f"Searching in {history_path}")

found = []

for root, dirs, files in os.walk(history_path):
    if 'entries.json' in files:
        entries_file = os.path.join(root, 'entries.json')
        try:
            with open(entries_file, 'r', encoding='utf-8') as f:
                content = f.read()
                if 'FundamentalPage.jsx' in content or 'FundamentalGrid.jsx' in content or 'GlobalHeader.jsx' in content:
                    found.append(root)
        except Exception:
            pass

for folder in found:
    entries_file = os.path.join(folder, 'entries.json')
    print(f"\nFound history in: {folder}")
    try:
        with open(entries_file, 'r', encoding='utf-8') as f:
            print(f.read())
    except:
        pass
