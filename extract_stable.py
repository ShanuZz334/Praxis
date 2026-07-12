import json, re, os

transcript_path = r'C:\Users\shanif\.gemini\antigravity\brain\7befe3ca-9c18-4e87-82b5-b88ddb9438ed\.system_generated\logs\transcript_full.jsonl'
out_dir = r'C:\project\ALLBACKUP\Praxis\stable_restore'
os.makedirs(out_dir, exist_ok=True)

# Extract specific steps to get original file content
# We want the EARLIEST view of each file - before any modifications
targets = {
    'FundamentalPage.jsx':  [3455, 3654, 3683, 3716, 3719, 3881, 3907, 3934, 3937, 3940, 3943, 4018, 4021],
    'FundamentalGrid.jsx':  [3345, 3467, 3470, 3625, 3636, 3692, 3857, 3860, 3875, 3921, 4054, 4156, 4159],
    'GlobalHeader.jsx':     [3645, 3673, 3676, 3825, 3834, 4046, 4049],
    'PERatioCard.jsx':      [3648, 3689, 3748, 3978, 3984, 4069, 4194, 4248, 4316],
}

# We want the FIRST/earliest step for each file
first_steps = {fname: min(steps) for fname, steps in targets.items()}
print("Looking for first steps:")
for fname, step in first_steps.items():
    print(f"  {fname}: step {step}")

# Now scan the transcript and collect content from those steps
found = {}

with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            entry = json.loads(line)
            step = entry.get('step_index', -1)
            etype = entry.get('type', '')
            
            for fname, target_step in first_steps.items():
                if step == target_step and etype == 'VIEW_FILE':
                    content = entry.get('content', '')
                    found[fname] = (step, content)
                    
        except Exception:
            pass

print()
for fname, (step, content) in found.items():
    # Extract the numbered lines 
    lines = []
    in_file = False
    for line in content.split('\n'):
        m = re.match(r'^(\d+): (.*)$', line)
        if m:
            in_file = True
            lines.append(m.group(2).rstrip('\r'))
        elif in_file and "The above content does NOT show the entire file" in line:
            break
    
    out_path = os.path.join(out_dir, fname)
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    print(f"Saved {fname} from step {step}: {len(lines)} lines")

for fname in targets.keys():
    if fname not in found:
        print(f"NOT FOUND: {fname}")
