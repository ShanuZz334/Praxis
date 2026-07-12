import json, re

transcript_path = r'C:\Users\shanif\.gemini\antigravity\brain\7befe3ca-9c18-4e87-82b5-b88ddb9438ed\.system_generated\logs\transcript_full.jsonl'

for target in ['OptionsPage.jsx', 'OptionsChainLayout.jsx']:
    print(f'\n{target} views:')
    with open(transcript_path, 'r', encoding='utf-8') as f:
        for line in f:
            try:
                entry = json.loads(line)
                if entry.get('type') == 'VIEW_FILE':
                    content = entry.get('content', '')
                    if target in content:
                        ts = content.split('\n')[0]
                        total_match = re.search(r'Total Lines: (\d+)', content)
                        total = total_match.group(1) if total_match else '?'
                        print(f"Step {entry.get('step_index')}: {ts} | Total Lines: {total}")
            except Exception:
                pass
