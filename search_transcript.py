import json

transcript_path = r'C:\Users\shanif\.gemini\antigravity\brain\7befe3ca-9c18-4e87-82b5-b88ddb9438ed\.system_generated\logs\transcript_full.jsonl'
count = 0
with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            entry = json.loads(line)
            t = entry.get('type','')
            if t == 'TOOL_RESPONSE':
                content = str(entry.get('content', '')) + str(entry.get('output', ''))
                if 'FundamentalPage' in content:
                    count += 1
                    step = entry.get('step_index')
                    keys = list(entry.keys())
                    print(f"Found at step {step}, keys: {keys}")
                    print(content[:300])
                    print('---')
                    if count > 5:
                        break
        except Exception as e:
            pass

print(f"Total: {count}")
