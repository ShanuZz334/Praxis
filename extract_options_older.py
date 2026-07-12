import json, re, os

transcript_path = r'C:\Users\shanif\.gemini\antigravity\brain\7befe3ca-9c18-4e87-82b5-b88ddb9438ed\.system_generated\logs\transcript_full.jsonl'
out_dir = r'C:\project\ALLBACKUP\Praxis\frontend\stock-look\src\features\dashboard\options\ui'

targets = {
    'OptionsPage.jsx': [2528, 2531, 2615, 2627, 2634, 2661, 3204, 3208, 3212, 3224, 3461],
    'OptionsChainLayout.jsx': [2540, 2554]
}

file_data = {fname: {} for fname in targets}

with open(transcript_path, 'r', encoding='utf-8') as f:
    for tline in f:
        try:
            entry = json.loads(tline)
            step = entry.get('step_index', -1)
            etype = entry.get('type', '')
            
            if etype != 'VIEW_FILE' and etype != 'MODEL_OUTPUT' and etype != 'TOOL_RESPONSE':
                pass
                
            content = entry.get('content', '')
            # Try to catch any read
            for fname, steps in targets.items():
                if fname not in content:
                    continue
                if step not in steps:
                    continue
                    
                # Extract numbered lines
                for line in content.split('\n'):
                    m = re.match(r'^(\d+): (.*)$', line)
                    if m:
                        linenum = int(m.group(1))
                        linetext = m.group(2).rstrip('\r')
                        
                        # Overwrite so we get the LATEST view among these steps
                        file_data[fname][linenum] = linetext
        except Exception:
            pass

for fname, lines_dict in file_data.items():
    if not lines_dict:
        print(f"No data found for {fname}")
        continue
    
    max_line = max(lines_dict.keys())
    missing = [i for i in range(1, max_line+1) if i not in lines_dict]
    print(f"File {fname}: lines 1-{max_line}, {len(missing)} missing")
    if missing:
        print(f"  Missing: {missing[:10]}")
        continue
    
    out_path = os.path.join(out_dir, fname)
    if fname == 'OptionsChainLayout.jsx':
        out_path = os.path.join(out_dir, 'chain', fname)
        
    out_lines = [lines_dict.get(i, '') for i in range(1, max_line+1)]
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(out_lines))
    print(f"Saved {out_path}")
