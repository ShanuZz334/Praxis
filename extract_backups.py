import json
import os
import re

transcript_path = r'C:\Users\shanif\.gemini\antigravity\brain\7befe3ca-9c18-4e87-82b5-b88ddb9438ed\.system_generated\logs\transcript_full.jsonl'
files = {
    'FundamentalPage.jsx': '',
    'FundamentalGrid.jsx': '',
    'GlobalHeader.jsx': ''
}

with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            entry = json.loads(line)
            if entry.get('type') == 'TOOL_RESPONSE' and 'output' in entry:
                content = entry['output']
            elif entry.get('type') == 'TOOL_RESPONSE' and 'content' in entry:
                content = entry['content']
            else:
                continue
                
            for filename in files.keys():
                if f'File Path: `file:///C:/project/ALLBACKUP/Praxis/frontend/stock-look/src/features/dashboard/fundamentals/ui/{filename}`' in content or f'File Path: `file:///C:/project/ALLBACKUP/Praxis/frontend/stock-look/src/shared/components/ui/GlobalHeader/{filename}`' in content:
                    if not files[filename]: # Keep FIRST occurrence
                        files[filename] = content
        except Exception as e:
            pass

for filename, content in files.items():
    if content:
        # Extract everything after "The following code has been modified..."
        # or just extract lines matching "^\d+: (.*)$"
        lines = []
        for line in content.split('\n'):
            match = re.match(r'^\d+: (.*)$', line)
            if match:
                lines.append(match.group(1))
            elif "The above content does NOT show the entire file" in line:
                break
        
        with open(f'C:\\project\\ALLBACKUP\\Praxis\\{filename}.backup', 'w', encoding='utf-8') as out_f:
            out_f.write('\n'.join(lines))
        print(f"Restored {filename} to backup!")
