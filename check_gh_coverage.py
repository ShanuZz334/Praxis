import json, re

transcript_path = r'C:\Users\shanif\.gemini\antigravity\brain\7befe3ca-9c18-4e87-82b5-b88ddb9438ed\.system_generated\logs\transcript_full.jsonl'

# Find lines 141-149, 251-299, 341-379 which are missing from GlobalHeader reconstruction
# These are in the 488-line version. Look for steps that might have these lines
# Also look for earlier steps in the session (steps 1-3645 area)

target_steps = {3645, 3673, 3676, 3825, 3834, 4046, 4049}

# Print what ranges each step covers
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
            
            range_match = re.search(r'Showing lines (\d+) to (\d+)', content)
            if not range_match:
                continue
            
            start_l = int(range_match.group(1))
            end_l = int(range_match.group(2))
            
            # Check if this covers our missing ranges
            missing_covered = []
            for ml in [145, 275, 360]:  # middle of missing ranges
                if start_l <= ml <= end_l:
                    missing_covered.append(ml)
            
            if missing_covered:
                print(f"Step {step} ({start_l}-{end_l}) covers missing area around lines {missing_covered}")
            
        except Exception:
            pass

print("Done checking coverage")
print()
print("Missing ranges: 141-149, 251-299, 341-379")
print("None of the captured views cover these ranges.")
print("Need to check VSCode history (480-line version) to fill gaps.")
