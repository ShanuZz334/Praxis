import json
import os

transcript_path = r'C:\Users\shanif\.gemini\antigravity\brain\7befe3ca-9c18-4e87-82b5-b88ddb9438ed\.system_generated\logs\transcript_full.jsonl'
output_dir = r'C:\project\ALLBACKUP\Praxis\history_dump'
os.makedirs(output_dir, exist_ok=True)

count = 0
with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            entry = json.loads(line)
            
            # Check if this was a tool call that wrote to FundamentalPage
            if entry.get('type') == 'PLANNER_RESPONSE' and 'tool_calls' in entry:
                for tc in entry['tool_calls']:
                    if tc['name'] in ['write_to_file', 'replace_file_content', 'multi_replace_file_content']:
                        args = tc.get('args', {})
                        target = args.get('TargetFile', '')
                        if 'FundamentalPage.jsx' in target or 'FundamentalGrid.jsx' in target:
                            count += 1
                            with open(os.path.join(output_dir, f"{count}_{tc['name']}.json"), 'w', encoding='utf-8') as out:
                                json.dump(args, out, indent=2)
            
            # Or if it was a file view
            if entry.get('type') == 'TOOL_RESPONSE' and 'content' in entry:
                content = entry['content']
                if 'FundamentalPage.jsx' in content or 'FundamentalGrid.jsx' in content:
                    count += 1
                    with open(os.path.join(output_dir, f"{count}_view.txt"), 'w', encoding='utf-8') as out:
                        out.write(content)
                        
        except Exception:
            pass

print(f"Dumped {count} interactions")
