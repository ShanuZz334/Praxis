import json

transcript_path = r'C:\Users\shanif\.gemini\antigravity\brain\7befe3ca-9c18-4e87-82b5-b88ddb9438ed\.system_generated\logs\transcript_full.jsonl'

# Unique types
types_seen = set()
count = 0
with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        count += 1
        try:
            entry = json.loads(line)
            t = entry.get('type', '')
            types_seen.add(t)
            
            # Check content for FundamentalPage in ALL fields
            raw = line
            if 'FundamentalPage' in raw and t not in ('PLANNER_RESPONSE',):
                step = entry.get('step_index')
                print(f"Found 'FundamentalPage' at step {step}, type={t}")
                print(raw[:500])
                print('---')
                
        except Exception as e:
            pass

print(f"Total lines: {count}")
print(f"Types seen: {types_seen}")
