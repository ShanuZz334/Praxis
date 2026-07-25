import os, re

d = r'C:\project\ALLBACKUP\Praxis\frontend\stock-look\src\features\dashboard\technical\ui'
files = [f for f in os.listdir(d) if f.endswith('Card.jsx')]
for f in files:
    path = os.path.join(d, f)
    with open(path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # 1. Remove import
    content = re.sub(r'import\s+{\s*score\w+Card\s*}\s+from\s+[\'\"].*?TechnicalCompositeEngine[\'\"];\n?', '', content)
    
    # 2. Replace let { score... block
    pattern = r'let\s+{\s*score,\s*bias,\s*confidence,\s*aiInsight\s*}\s*=\s*score\w+Card\([^;]+\);\s*score\s*=\s*engineData\?\.score\s*\?\?\s*score;\s*bias\s*=\s*engineData\?\.bias\s*\?\?\s*bias;\s*confidence\s*=\s*engineData\?\.confidence\s*!==\s*undefined\s*\?\s*`\$\{engineData\.confidence\}%`\s*:\s*confidence;'
    replacement = '''const score = engineData?.score ?? null;
    const bias = engineData?.bias ?? "Neutral";
    const confidence = engineData?.confidence !== undefined ? `${engineData.confidence}%` : "0%";
    const aiInsight = engineData?.aiInsight ?? "Awaiting insights...";'''
    
    new_content = re.sub(pattern, replacement, content, flags=re.MULTILINE)
    
    if new_content != content:
        with open(path, 'w', encoding='utf-8') as file:
            file.write(new_content)
        print(f'Updated {f}')
