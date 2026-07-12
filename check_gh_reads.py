import json, re, os

transcript_path = r'C:\Users\shanif\.gemini\antigravity\brain\7befe3ca-9c18-4e87-82b5-b88ddb9438ed\.system_generated\logs\transcript_full.jsonl'
out_dir = r'C:\project\ALLBACKUP\Praxis\stable_restore'

# GlobalHeader steps: 3645, 3673, 3676, 3825, 3834, 4046, 4049
target_steps = {3645, 3673, 3676, 3825, 3834, 4046, 4049}

all_lines = {}
totals = {}

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
            if 'GlobalHeader.jsx' not in content:
                continue
            
            total_match = re.search(r'Total Lines: (\d+)', content)
            range_match = re.search(r'Showing lines (\d+) to (\d+)', content)
            total = int(total_match.group(1)) if total_match else 0
            totals[step] = total
            print(f"Step {step}: {range_match.group(0) if range_match else '?'} of {total}")
            
            for line in content.split('\n'):
                m = re.match(r'^(\d+): (.*)$', line)
                if m:
                    linenum = int(m.group(1))
                    text = m.group(2).rstrip('\r')
                    if linenum not in all_lines:
                        all_lines[linenum] = (step, total, text)
                    else:
                        existing_total = all_lines[linenum][1]
                        if total > existing_total:
                            all_lines[linenum] = (step, total, text)
                            
        except Exception:
            pass

max_line = max(all_lines.keys()) if all_lines else 0
missing = [i for i in range(1, max_line+1) if i not in all_lines]
print(f"\nGlobalHeader: lines 1-{max_line}, {len(all_lines)} captured, {len(missing)} missing")
if missing:
    # Show ranges of missing
    if missing:
        start = missing[0]
        prev = missing[0]
        ranges = []
        for m in missing[1:]:
            if m == prev + 1:
                prev = m
            else:
                ranges.append(f"{start}-{prev}")
                start = prev = m
        ranges.append(f"{start}-{prev}")
        print(f"Missing ranges: {', '.join(ranges[:10])}")
