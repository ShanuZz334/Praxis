import json, re, os

transcript_path = r'C:\Users\shanif\.gemini\antigravity\brain\7befe3ca-9c18-4e87-82b5-b88ddb9438ed\.system_generated\logs\transcript_full.jsonl'
out_dir = r'C:\project\ALLBACKUP\Praxis\stable_restore'
os.makedirs(out_dir, exist_ok=True)

# Find FundamentalPage views and check which showed line 1 (start of file)
# Views around steps 3934-3943 seem to be complete multi-part reads

# Let's extract ALL numbered lines from FundamentalPage views from steps 3907-3943
# because these were consecutive reads of the same file
target_steps = list(range(3700, 4170))

# For each file, collect all lines across all views
# KEY: line_num -> (step_that_read_it, content)
pages = {}  # fname -> {linenum: text}

def get_fname(content):
    for line in content.split('\n'):
        if 'File Path:' in line:
            if 'FundamentalPage.jsx' in line:
                return 'FundamentalPage.jsx'
            if 'FundamentalGrid.jsx' in line:
                return 'FundamentalGrid.jsx'
            if 'GlobalHeader.jsx' in line:
                return 'GlobalHeader.jsx'
            if 'PERatioCard.jsx' in line:
                return 'PERatioCard.jsx'
    return None

with open(transcript_path, 'r', encoding='utf-8') as f:
    for tline in f:
        try:
            entry = json.loads(tline)
            step = entry.get('step_index', -1)
            etype = entry.get('type', '')
            
            if etype != 'VIEW_FILE':
                continue
            
            if step not in target_steps:
                continue
                
            content = entry.get('content', '')
            fname = get_fname(content)
            if not fname:
                continue
            
            if fname not in pages:
                pages[fname] = {}
            
            # Extract all numbered lines
            for line in content.split('\n'):
                m = re.match(r'^(\d+): (.*)$', line)
                if m:
                    linenum = int(m.group(1))
                    linetext = m.group(2).rstrip('\r')
                    # First occurrence wins (earliest step)
                    if linenum not in pages[fname]:
                        pages[fname][linenum] = linetext
            
        except Exception as e:
            pass

print("Reconstructed line coverage:")
for fname, linesdict in pages.items():
    if linesdict:
        max_line = max(linesdict.keys())
        missing = [i for i in range(1, max_line+1) if i not in linesdict]
        print(f"  {fname}: lines 1-{max_line}, {len(linesdict)} lines, {len(missing)} missing")
        if missing:
            print(f"    Missing lines: {missing[:20]}")
        
        # Write it
        out_path = os.path.join(out_dir, fname)
        out_lines = [linesdict.get(i, '') for i in range(1, max_line+1)]
        with open(out_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(out_lines))
