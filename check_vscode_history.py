import json
import os

# VSCode local history folder for Praxis GlobalHeader
history_folder = r'C:\Users\shanif\AppData\Roaming\Code\User\History\2dea06d0'
entries_file = os.path.join(history_folder, 'entries.json')

with open(entries_file, 'r', encoding='utf-8') as f:
    entries = json.load(f)

print("Resource:", entries.get('resource'))
print("Entries:")
for e in entries.get('entries', []):
    ts = e.get('timestamp', 0) / 1000
    import datetime
    dt = datetime.datetime.fromtimestamp(ts)
    print(f"  id={e['id']}  timestamp={ts}  datetime={dt}")
