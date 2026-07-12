import json, os, datetime

history_root = r'C:\Users\shanif\AppData\Roaming\Code\User\History'

# Print ALL history entries for Praxis across all time
print("ALL Praxis History entries:")

all_entries = []

for folder in os.listdir(history_root):
    folder_path = os.path.join(history_root, folder)
    entries_file = os.path.join(folder_path, 'entries.json')
    if not os.path.exists(entries_file):
        continue
    try:
        with open(entries_file, 'r', encoding='utf-8') as f:
            entries = json.load(f)
        res = entries.get('resource', '')
        if 'ALLBACKUP/Praxis' not in res:
            continue
        
        for e in entries.get('entries', []):
            ts = e.get('timestamp', 0) / 1000
            all_entries.append((ts, res, folder, e['id']))
    except Exception as ex:
        pass

# Sort by timestamp
all_entries.sort(key=lambda x: x[0])
for ts, res, folder, eid in all_entries:
    dt = datetime.datetime.fromtimestamp(ts)
    filename = res.split('/')[-1]
    print(f"{dt}  {filename}  ({folder}/{eid})")
