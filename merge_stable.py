import json, re, os

transcript_path = r'C:\Users\shanif\.gemini\antigravity\brain\7befe3ca-9c18-4e87-82b5-b88ddb9438ed\.system_generated\logs\transcript_full.jsonl'
out_dir = r'C:\project\ALLBACKUP\Praxis\stable_restore'
os.makedirs(out_dir, exist_ok=True)

# For each file, collect ALL VIEW_FILE entries from before the first modification
# FundamentalPage - first write was in history_dump (step ~1 of edits)
# FundamentalGrid - first write was also early
# GlobalHeader - first write was also early

# From find_early_views output, we know which steps have views
# I need to collect content from all view steps for each file,
# and merge the numbered lines to reconstruct full file content

view_steps = {
    'FundamentalPage.jsx': [3455, 3654, 3683, 3716, 3719, 3881, 3907, 3934, 3937, 3940, 3943, 4018, 4021],
    'FundamentalGrid.jsx': [3345, 3467, 3470, 3625, 3636, 3692, 3857, 3860, 3875, 3921, 4054, 4156, 4159],
    'GlobalHeader.jsx':    [3645, 3673, 3676, 3825, 3834, 4046, 4049],
    'PERatioCard.jsx':     [3648, 3689, 3748, 3978, 3984, 4069, 4194, 4248, 4316],
}

# Collect all line data for each file
file_data = {fname: {} for fname in view_steps}  # line_num -> content

with open(transcript_path, 'r', encoding='utf-8') as f:
    for tline in f:
        try:
            entry = json.loads(tline)
            step = entry.get('step_index', -1)
            etype = entry.get('type', '')
            
            if etype != 'VIEW_FILE':
                continue
            
            content = entry.get('content', '')
            
            for fname, steps in view_steps.items():
                if step not in steps:
                    continue
                if fname not in content and fname.replace('.jsx', '') not in content:
                    continue
                
                # Check if this is a view of the right file
                if 'File Path:' in content and fname not in content:
                    continue
                    
                # Extract numbered lines
                for line in content.split('\n'):
                    m = re.match(r'^(\d+): (.*)$', line)
                    if m:
                        linenum = int(m.group(1))
                        linetext = m.group(2).rstrip('\r')
                        # Only store if not already stored (first view wins)
                        if linenum not in file_data[fname]:
                            file_data[fname][linenum] = linetext
                            
        except Exception as e:
            pass

# Write out the reconstructed files
for fname, lines_dict in file_data.items():
    if not lines_dict:
        print(f"No data for {fname}")
        continue
    
    max_line = max(lines_dict.keys())
    reconstructed = []
    for i in range(1, max_line + 1):
        reconstructed.append(lines_dict.get(i, ''))
    
    out_path = os.path.join(out_dir, fname)
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(reconstructed))
    print(f"Saved {fname}: {max_line} lines, {len(lines_dict)} unique lines captured")
