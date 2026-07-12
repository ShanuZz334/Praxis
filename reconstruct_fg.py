import json, re, os

transcript_path = r'C:\Users\shanif\.gemini\antigravity\brain\7befe3ca-9c18-4e87-82b5-b88ddb9438ed\.system_generated\logs\transcript_full.jsonl'
out_dir = r'C:\project\ALLBACKUP\Praxis\stable_restore'

# Steps 3467 + 3470 give us the complete 293-line FundamentalGrid
# Steps 3857, 3860, 3875, 3921 give us lines from 304-line version
# Use 304-line version as authoritative (latest before modifications)

target_steps = {3345, 3467, 3470, 3625, 3636, 3692, 3857, 3860, 3875, 3921}

all_lines = {}  # line_num -> (step, text)
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
            if 'FundamentalGrid.jsx' not in content:
                continue
            
            total_match = re.search(r'Total Lines: (\d+)', content)
            total = int(total_match.group(1)) if total_match else 0
            totals[step] = total
            
            for line in content.split('\n'):
                m = re.match(r'^(\d+): (.*)$', line)
                if m:
                    linenum = int(m.group(1))
                    text = m.group(2).rstrip('\r')
                    # Prefer lines from the 304-line version (latest stable)
                    if linenum not in all_lines:
                        all_lines[linenum] = (step, total, text)
                    else:
                        # Prefer higher total (more complete/later version)
                        existing_total = all_lines[linenum][1]
                        if total > existing_total:
                            all_lines[linenum] = (step, total, text)
                            
        except Exception:
            pass

max_line = max(all_lines.keys()) if all_lines else 0
missing = [i for i in range(1, max_line+1) if i not in all_lines]
print(f"FundamentalGrid: lines 1-{max_line}, {len(all_lines)} captured, {len(missing)} missing")
if missing:
    print(f"Missing: {missing[:30]}")

# Write out
out_path = os.path.join(out_dir, 'FundamentalGrid.jsx')
lines_out = [all_lines.get(i, (0, 0, ''))[2] for i in range(1, max_line+1)]
with open(out_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines_out))
print(f"Saved to {out_path}")
