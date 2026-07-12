import json

transcript_path = r'C:\Users\shanif\.gemini\antigravity\brain\7befe3ca-9c18-4e87-82b5-b88ddb9438ed\.system_generated\logs\transcript_full.jsonl'

max_lines = 0
best_step = -1

with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            entry = json.loads(line)
            content = entry.get('content', '')
            # Also check tool_calls for write_to_file or replace_file_content
            if entry.get('type') == 'PLANNER_RESPONSE':
                for tc in entry.get('tool_calls', []):
                    if tc.get('name') in ['write_to_file', 'replace_file_content']:
                        args = tc.get('args', {})
                        tgt = args.get('TargetFile', '')
                        if 'OptionsPage.jsx' in tgt:
                            code = args.get('CodeContent', '') or args.get('ReplacementContent', '')
                            lc = len(code.split('\n'))
                            print(f"Step {entry.get('step_index')}: {tc.get('name')} with {lc} lines")
                            
            if 'OptionsPage.jsx' in content and 'export default function OptionsPage' in content:
                lc = len(content.split('\n'))
                if lc > max_lines:
                    max_lines = lc
                    best_step = entry.get('step_index')
                print(f"Step {entry.get('step_index')}: {entry.get('type')} with {lc} lines")
        except Exception:
            pass

print(f"Max lines: {max_lines} at step {best_step}")
