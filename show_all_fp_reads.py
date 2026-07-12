import json, re

transcript_path = r'C:\Users\shanif\.gemini\antigravity\brain\7befe3ca-9c18-4e87-82b5-b88ddb9438ed\.system_generated\logs\transcript_full.jsonl'

# Show all views of the 283-line FundamentalPage to find lines 1-29 and 116-179 and 251-283
# 239-line version was before a small addition, line numbers 1-86 should match (from step 3455)
# Step 3654 showed 126-line (lines 1-100)
# Step 3716 showed 239-line (lines 110-140)
# Step 3719 showed 239-line (lines 180-239)
# Step 3881 showed 234-line (lines 80-140)
# Step 3907 showed 244-line (lines 105-180)

target_steps = {3654, 3716, 3719, 3881, 3907}

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
            
            total_match = re.search(r'Total Lines: (\d+)', content)
            range_match = re.search(r'Showing lines (\d+) to (\d+)', content)
            print(f"\n=== STEP {step}: {range_match.group(0) if range_match else '?'} of {total_match.group(1) if total_match else '?'} total ===")
            for line in content.split('\n'):
                m = re.match(r'^(\d+): (.*)$', line)
                if m:
                    print(f"{m.group(1)}: {m.group(2)}")
        except Exception:
            pass
