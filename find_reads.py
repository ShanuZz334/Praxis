import json, re, os

transcript_path = r'C:\Users\shanif\.gemini\antigravity\brain\7befe3ca-9c18-4e87-82b5-b88ddb9438ed\.system_generated\logs\transcript_full.jsonl'
out_dir = r'C:\project\ALLBACKUP\Praxis\stable_restore'

# Steps that read FundamentalPage (from find_early_views output)
fp_steps = [3455, 3654, 3683, 3716, 3719, 3881, 3907, 3934, 3937, 3940, 3943, 4018, 4021]

# Each view shows "Showing lines X to Y" header
# Collect all reads with their ranges and extract the canonical version

reads = []

with open(transcript_path, 'r', encoding='utf-8') as f:
    for tline in f:
        try:
            entry = json.loads(tline)
            step = entry.get('step_index', -1)
            etype = entry.get('type', '')
            
            if etype != 'VIEW_FILE' or step not in fp_steps:
                continue
                
            content = entry.get('content', '')
            if 'FundamentalPage.jsx' not in content:
                continue
            
            # Find range shown
            range_match = re.search(r'Showing lines (\d+) to (\d+)', content)
            total_match = re.search(r'Total Lines: (\d+)', content)
            
            start_line = int(range_match.group(1)) if range_match else 0
            end_line = int(range_match.group(2)) if range_match else 0
            total = int(total_match.group(1)) if total_match else 0
            
            # Extract lines
            lines = {}
            for line in content.split('\n'):
                m = re.match(r'^(\d+): (.*)$', line)
                if m:
                    linenum = int(m.group(1))
                    lines[linenum] = m.group(2).rstrip('\r')
            
            reads.append((step, start_line, end_line, total, lines))
            print(f"Step {step}: showing lines {start_line}-{end_line} of {total}, got {len(lines)} lines")
            
        except Exception as e:
            pass

# Now merge: prefer EARLIEST read for each line
# But we need to figure out which version the file was in at each step
# The file was modified during steps 3700-3950 approximately
# Steps BEFORE modifications will give the original content
# Steps AFTER modifications will give modified content

# From the transcript, modifications happened:
# Step 3716 was a VIEW before modification, 3719 was also view
# The first CODE_ACTION that modified FundamentalPage would be later

print()
print("Looking for code actions (modifications) to FundamentalPage...")
