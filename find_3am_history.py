import json, os, datetime

history_root = r'C:\Users\shanif\AppData\Roaming\Code\User\History'

# Find ALL files from Praxis modified between midnight and 6am on July 12
# midnight IST = 18:30 UTC July 11 = 1783730400
# 6am IST = 0:30 UTC July 12 = 1783730400 + 21600 = 1783752000

start = 1783730400
end = 1783752000  # 6am IST July 12

print(f"Looking for files between {datetime.datetime.fromtimestamp(start)} and {datetime.datetime.fromtimestamp(end)}")
print()

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
        
        relevant = [e for e in entries.get('entries', []) if start <= e.get('timestamp',0)/1000 <= end]
        if relevant:
            print(f'Resource: {res}')
            for e in relevant:
                ts = e.get('timestamp', 0) / 1000
                dt = datetime.datetime.fromtimestamp(ts)
                eid = e['id']
                print(f'  {folder}/{eid}  {dt}')
    except Exception as ex:
        pass
