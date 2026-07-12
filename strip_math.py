import os
import re

card_dir = r"C:\project\ALLBACKUP\Praxis\frontend\stock-look\src\features\dashboard\fundamentals\ui"

def remove_function(content, func_name_prefix):
    # Matches function scoreSomething(args) { ... }
    # Using a brace counter to find the end
    pattern = r"function\s+" + func_name_prefix + r"\w*\s*\([^)]*\)\s*{"
    match = re.search(pattern, content)
    if not match:
        return content
    
    start_idx = match.start()
    brace_count = 0
    in_string = False
    string_char = ''
    i = start_idx
    
    # Fast forward to first brace
    while i < len(content) and content[i] != '{':
        i += 1
        
    brace_count = 1
    i += 1
    
    while i < len(content) and brace_count > 0:
        c = content[i]
        if in_string:
            if c == string_char and content[i-1] != '\\':
                in_string = False
        else:
            if c in ['"', "'", '`']:
                in_string = True
                string_char = c
            elif c == '{':
                brace_count += 1
            elif c == '}':
                brace_count -= 1
        i += 1
        
    return content[:start_idx] + content[i:]

def strip_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    original = content
        
    # Remove score* and generateAiInsight functions
    content = remove_function(content, "score")
    content = remove_function(content, "generateAiInsight")
    content = remove_function(content, "getScoreLabel") # some have this
    
    # Now replace the engine calls inside the component
    # e.g. const { score, bias, confidence } = scorePERatio(currentPE, historicalPE, sectorPE);
    call_pattern = r"const\s*{\s*score,\s*bias(?:,\s*confidence)?\s*}\s*=\s*score\w+\([^)]*\)\s*;"
    replacement = "const { score = 50, bias = 'Neutral', confidence = '50%' } = snapshotCard || {};"
    content = re.sub(call_pattern, replacement, content)
    
    # Now replace aiInsight
    insight_pattern = r"const\s+aiInsight\s*=\s*generateAiInsight\([^)]*\)\s*;"
    insight_replacement = "const aiInsight = 'Insight from AI Engine coming soon...';"
    content = re.sub(insight_pattern, insight_replacement, content)

    # Change export default function PERatioCard({ data ... }) to accept snapshotCard
    comp_pattern = r"export default function (\w+Card)\(\{\s*data\s*=\s*null,\s*manualOverride,\s*lastUpdated\s*\}\)\s*\{"
    comp_replacement = r"export default function \1({ data = null, manualOverride, lastUpdated, snapshotCard }) {"
    content = re.sub(comp_pattern, comp_replacement, content)
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Stripped math from {os.path.basename(filepath)}")

for filename in os.listdir(card_dir):
    if filename.endswith("Card.jsx") and filename != "IndicatorCard.jsx" and filename != "FundamentalCard.jsx":
        strip_file(os.path.join(card_dir, filename))
