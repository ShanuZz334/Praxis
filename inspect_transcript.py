import json

transcript_path = r'C:\Users\shanif\.gemini\antigravity\brain\7befe3ca-9c18-4e87-82b5-b88ddb9438ed\.system_generated\logs\transcript_full.jsonl'
count = 0
step = 0
with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        step += 1
        if step <= 5:
            try:
                entry = json.loads(line)
                print(f"Step {step}: type={entry.get('type')}, source={entry.get('source')}, keys={list(entry.keys())}")
            except Exception as e:
                print(f"Error at line {step}: {e}")
                print(line[:200])

print(f"First 5 lines read")
