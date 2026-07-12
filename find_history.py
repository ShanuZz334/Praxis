import json, os, datetime

history_root = r'C:\Users\shanif\AppData\Roaming\Code\User\History'
for folder in os.listdir(history_root):
    folder_path = os.path.join(history_root, folder)
    entries_file = os.path.join(folder_path, 'entries.json')
    if not os.path.exists(entries_file):
        continue
    try:
        with open(entries_file, 'r', encoding='utf-8') as f:
            entries = json.load(f)
        res = entries.get('resource', '')
        keywords = ['FundamentalPage', 'FundamentalGrid', 'PERatio', 'ForwardPE', 'PBRatio', 'EarningsYield']
        if 'ALLBACKUP/Praxis' in res and any(k in res for k in keywords):
            print(f'\nFolder: {folder}')
            print(f'Resource: {res}')
            for e in entries.get('entries', []):
                ts = e.get('timestamp', 0) / 1000
                dt = datetime.datetime.fromtimestamp(ts)
                eid = e['id']
                print(f'  {eid}  {dt}')
    except Exception as ex:
        pass
