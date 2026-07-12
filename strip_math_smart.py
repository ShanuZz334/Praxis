import os
import re

card_dir = r"C:\project\ALLBACKUP\Praxis\frontend\stock-look\src\features\dashboard\fundamentals\ui"

def strip_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    original = content
    
    # Remove everything between the first 'function score' and '// ─── Main Component' or 'export default function'
    pattern = r"(function\s+score\w*\s*\([^)]*\)\s*\{)[\s\S]*?(?=// ─── Main Component|export default function)"
    content = re.sub(pattern, "", content)
    
    # Replace the engine calls inside the component
    # Match any destructuring assignment from a score* function: const { ...vars } = scoreSomething(...);
    # Example match: const { score, bias, confidence, trendLabel, cagr } = scoreEarningsTrend(...);
    def replace_score_call(match):
        vars_str = match.group(1) # ' score, bias, confidence, trendLabel, cagr '
        
        # We need to add defaults to the variables if they don't have them
        vars_list = [v.strip() for v in vars_str.split(',')]
        new_vars = []
        for v in vars_list:
            if not v: continue
            if v == 'score': new_vars.append("score = 50")
            elif v == 'bias': new_vars.append("bias = 'Neutral'")
            elif v == 'confidence': new_vars.append("confidence = '50%'")
            else:
                new_vars.append(f"{v} = '--'")
                
        return f"const {{ {', '.join(new_vars)} }} = snapshotCard || {{}};"
        
    call_pattern = r"const\s*\{([^}]+)\}\s*=\s*score\w+\([^)]*\)\s*;"
    content = re.sub(call_pattern, replace_score_call, content)
    
    # Now replace aiInsight
    insight_pattern = r"const\s+(aiInsight|aiInsightText)\s*=\s*generateAiInsight\([^)]*\)\s*;"
    content = re.sub(insight_pattern, r"const \1 = 'Insight from AI Engine coming soon...';", content)

    # Change export default function PERatioCard({ data ... }) to accept snapshotCard
    comp_pattern = r"export default function (\w+Card)\(\{\s*data(\s*=\s*null)?,\s*manualOverride(s)?,\s*lastUpdated(.*?)\}\)\s*\{"
    comp_replacement = r"export default function \1({ data\2, manualOverride\3, lastUpdated\4, snapshotCard }) {"
    content = re.sub(comp_pattern, comp_replacement, content)
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Stripped math safely from {os.path.basename(filepath)}")

for filename in os.listdir(card_dir):
    if filename.endswith("Card.jsx") and filename != "IndicatorCard.jsx" and filename != "FundamentalCard.jsx":
        strip_file(os.path.join(card_dir, filename))
