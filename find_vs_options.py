import os, glob, time

history_dir = r'C:\Users\shanif\AppData\Roaming\Code\User\History'

results = []
for root, _, files in os.walk(history_dir):
    for f in files:
        path = os.path.join(root, f)
        try:
            mtime = os.path.getmtime(path)
            # Only look at files modified recently
            if time.time() - mtime > 7 * 24 * 3600:
                continue
            with open(path, 'r', encoding='utf-8', errors='ignore') as file:
                content = file.read()
                if 'OptionsPage' in content and 'export default function OptionsPage' in content:
                    results.append({'file': 'OptionsPage', 'path': path, 'mtime': mtime, 'len': len(content.splitlines())})
                elif 'OptionsChainLayout' in content and 'export default function OptionsChainLayout' in content:
                    results.append({'file': 'OptionsChainLayout', 'path': path, 'mtime': mtime, 'len': len(content.splitlines())})
        except Exception:
            pass

results.sort(key=lambda x: x['mtime'], reverse=True)
for r in results[:30]:
    dt = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(r['mtime']))
    print(f"{dt} | {r['file']} | {r['len']} lines | {r['path']}")
