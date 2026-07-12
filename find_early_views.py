import json, os, datetime

transcript_path = r'C:\Users\shanif\.gemini\antigravity\brain\7befe3ca-9c18-4e87-82b5-b88ddb9438ed\.system_generated\logs\transcript_full.jsonl'

# 9:20 AM IST = 3:50 AM UTC on July 12 2026
# Find timestamp for this moment
# From script output: 1783767176 = 2026-07-11 16:22 IST
# 2026-07-12 09:20 IST is exactly 17 hours later = 1783767176 + (17*3600) = 1783828376
cutoff_ts = 1783828376  # 9:20 AM IST July 12

print(f"Cutoff = {datetime.datetime.fromtimestamp(cutoff_ts)} (local IST)")
print()

# Find ALL VIEW_FILE entries from BEFORE the session started (step < 4162 approx)
# and show what was being read
files_seen = {}

with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            entry = json.loads(line)
            step = entry.get('step_index', 0)
            etype = entry.get('type', '')
            
            if etype == 'VIEW_FILE':
                content = entry.get('content', '')
                if 'FundamentalPage' in content or 'FundamentalGrid' in content or 'GlobalHeader' in content or 'PERatio' in content or 'FundamentalCard' in content:
                    # Parse filename from content
                    for line2 in content.split('\n'):
                        if 'File Path:' in line2:
                            fname = line2.strip()
                            break
                    else:
                        fname = f"(step {step})"
                    print(f"Step {step}: {fname}")
                    
        except Exception:
            pass
