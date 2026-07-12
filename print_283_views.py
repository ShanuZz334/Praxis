import json, re

transcript_path = r'C:\Users\shanif\.gemini\antigravity\brain\7befe3ca-9c18-4e87-82b5-b88ddb9438ed\.system_generated\logs\transcript_full.jsonl'

# Extract the EXACT content from steps 3934, 3937, 3940, 3943 (all 283-line reads)
target_steps = {3934, 3937, 3940, 3943}

with open(transcript_path, 'r', encoding='utf-8') as f:
    for tline in f:
        try:
            entry = json.loads(tline)
            step = entry.get('step_index', -1)
            if step not in target_steps:
                continue
            etype = entry.get('type', '')
            if etype != 'VIEW_FILE':
                continue
            content = entry.get('content', '')
            if 'FundamentalPage.jsx' not in content:
                continue
            
            range_match = re.search(r'Showing lines (\d+) to (\d+)', content)
            print(f"\n=== STEP {step}: {range_match.group(0) if range_match else 'unknown range'} ===")
            
            # Print the actual file lines
            for line in content.split('\n'):
                m = re.match(r'^(\d+): (.*)$', line)
                if m:
                    print(f"{m.group(1)}: {m.group(2)}")
                    
        except Exception:
            pass
