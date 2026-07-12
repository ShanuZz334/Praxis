import json
import os
import re

transcript_path = r'C:\Users\shanif\.gemini\antigravity\brain\7befe3ca-9c18-4e87-82b5-b88ddb9438ed\.system_generated\logs\transcript_full.jsonl'

# We want the FIRST time each file was READ (viewed) in this session
# That was BEFORE any of my modifications - so it shows the user's original state

target_files = {
    'FundamentalPage.jsx': None,
    'FundamentalGrid.jsx': None,
    'GlobalHeader.jsx': None,
    'PERatioCard.jsx': None,
    'PBRatioCard.jsx': None,
    'EarningsYieldCard.jsx': None,
    'ForwardPECard.jsx': None,
}

with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            entry = json.loads(line)
            if entry.get('type') == 'TOOL_RESPONSE':
                content = entry.get('content', '') or entry.get('output', '')
                
                for filename in target_files.keys():
                    if target_files[filename] is not None:
                        continue  # already found first view
                    
                    # Look for view_file responses
                    if f'File Path: `file:///C:/project/ALLBACKUP/Praxis' in content and filename in content:
                        target_files[filename] = content
                        
        except Exception:
            pass

out_dir = r'C:\project\ALLBACKUP\Praxis\original_files'
os.makedirs(out_dir, exist_ok=True)

for filename, content in target_files.items():
    if content:
        # Extract the actual file lines (format: "123: actualcode")
        lines = []
        for line in content.split('\n'):
            m = re.match(r'^\d+: (.*)$', line)
            if m:
                lines.append(m.group(1).rstrip('\r'))
        
        if lines:
            out_path = os.path.join(out_dir, filename)
            with open(out_path, 'w', encoding='utf-8', newline='\r\n') as f:
                f.write('\n'.join(lines))
            print(f"Saved {filename} ({len(lines)} lines)")
        else:
            print(f"No lines extracted for {filename}")
    else:
        print(f"NOT FOUND in transcript: {filename}")
