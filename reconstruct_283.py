import json, re, os

transcript_path = r'C:\Users\shanif\.gemini\antigravity\brain\7befe3ca-9c18-4e87-82b5-b88ddb9438ed\.system_generated\logs\transcript_full.jsonl'
out_dir = r'C:\project\ALLBACKUP\Praxis\stable_restore'

# The 283-line version is the STABLE version we want
# It was read at steps 3934, 3937, 3940, 3943 (all showing parts of 283-line file)
# Also step 3654 shows 126-line version, 3683 shows 163-line version, 3716/3719 shows 239-line version
# 3881/3907 shows 234/244-line version
# 
# The 283-line version has ALL the features (selectedCategory, selectedInstrument, manualOverrides, etc)
# We need to fill lines 1-29, 61-64, 86-89 from the 239-line version (steps 3716, 3719)
# because 239-line was also the stable version just at an earlier stage

# Let's do a comprehensive merge:
# - For lines that appear in 283-line reads (steps 3934-3943): use those
# - For lines that only appear in earlier reads: check if they're consistent

all_pages = {}  # step -> {linenum: text}
all_totals = {}  # step -> total_lines

target_steps = [3654, 3683, 3716, 3719, 3881, 3907, 3934, 3937, 3940, 3943]

with open(transcript_path, 'r', encoding='utf-8') as f:
    for tline in f:
        try:
            entry = json.loads(tline)
            step = entry.get('step_index', -1)
            etype = entry.get('type', '')
            
            if etype != 'VIEW_FILE' or step not in target_steps:
                continue
                
            content = entry.get('content', '')
            if 'FundamentalPage.jsx' not in content:
                continue
            
            total_match = re.search(r'Total Lines: (\d+)', content)
            total = int(total_match.group(1)) if total_match else 0
            all_totals[step] = total
            
            lines = {}
            for line in content.split('\n'):
                m = re.match(r'^(\d+): (.*)$', line)
                if m:
                    linenum = int(m.group(1))
                    lines[linenum] = m.group(2).rstrip('\r')
            
            all_pages[step] = lines
            
        except Exception:
            pass

# Reconstruct 283-line version
# Use the 283-line reads as primary
# Fill missing from other reads if they match line numbers
merged = {}

# First pass: add all lines from 283-line reads (authoritative)
for step in [3934, 3937, 3940, 3943]:
    if step in all_pages:
        for linenum, text in all_pages[step].items():
            merged[linenum] = text

# Second pass: fill gaps from the next closest (239-line reads)
for step in [3716, 3719]:
    if step in all_pages:
        for linenum, text in all_pages[step].items():
            if linenum not in merged:
                merged[linenum] = text

# Third pass: fill remaining gaps from earlier reads
for step in [3881, 3907, 3654, 3683]:
    if step in all_pages:
        for linenum, text in all_pages[step].items():
            if linenum not in merged:
                merged[linenum] = text

max_line = max(merged.keys()) if merged else 0
missing = [i for i in range(1, max_line+1) if i not in merged]
print(f"Total lines reconstructed: {max_line}")
print(f"Missing lines: {missing}")

# Write output
out_path = os.path.join(out_dir, 'FundamentalPage.jsx')
lines_out = [merged.get(i, '') for i in range(1, max_line+1)]
with open(out_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines_out))

print(f"\nSaved {out_path}")
print("\nFirst 30 lines:")
for i in range(1, min(31, max_line+1)):
    print(f"{i}: {merged.get(i, '<<MISSING>>')}")
