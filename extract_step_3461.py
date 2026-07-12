import json, re, os

transcript_path = r'C:\Users\shanif\.gemini\antigravity\brain\7befe3ca-9c18-4e87-82b5-b88ddb9438ed\.system_generated\logs\transcript_full.jsonl'
out_path = r'C:\project\ALLBACKUP\Praxis\frontend\stock-look\src\features\dashboard\options\ui\OptionsPage.jsx'

lines_dict = {}

with open(transcript_path, 'r', encoding='utf-8') as f:
    for tline in f:
        try:
            entry = json.loads(tline)
            step = entry.get('step_index', -1)
            
            # ONLY parse step 3461 which had 373 lines
            if step == 3461 and entry.get('type') == 'VIEW_FILE':
                content = entry.get('content', '')
                if 'OptionsPage.jsx' in content:
                    for line in content.split('\n'):
                        m = re.match(r'^(\d+): (.*)$', line)
                        if m:
                            linenum = int(m.group(1))
                            linetext = m.group(2).rstrip('\r')
                            lines_dict[linenum] = linetext
        except Exception:
            pass

if lines_dict:
    max_line = max(lines_dict.keys())
    out_lines = [lines_dict.get(i, '') for i in range(1, max_line+1)]
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(out_lines))
    print(f"Saved {max_line} lines to {out_path}")
else:
    print("Failed to find data in step 3461")
