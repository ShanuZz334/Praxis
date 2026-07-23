const fs = require('fs');

const file1 = 'C:\\project\\ALLBACKUP\\Praxis\\backend\\scripts\\audit_prompts.mjs';
let c1 = fs.readFileSync(file1, 'utf8');
c1 = c1.replace(/'max_pain','fno_ban',/g, "'max_pain',");
fs.writeFileSync(file1, c1);

const file2 = 'C:\\project\\ALLBACKUP\\Praxis\\backend\\scripts\\seed_round5_options.mjs';
let c2 = fs.readFileSync(file2, 'utf8');
const search = `    // MAX PAIN & F&O BAN
    {
        targetId: 'max_pain',
        displayName: 'Max Pain',
        appliesTo: 'both',
        systemInstruction: \`You are Praxis, an elite Indian F&O desk analyst. Analyze the Options Max Pain for {stockSymbol}.

Current data: Max Pain = {value} | Score: {score}/100 | Signal: {bias} | Confidence: {confidence}

Interpretation framework:
- Max Pain Theory suggests that option writers (smart money) will try to pin the stock price near the Max Pain strike at expiry to inflict maximum loss on option buyers.
- If the stock is currently trading far below Max Pain, it implies bullish pull towards that strike as expiry nears.
- If the stock is trading far above Max Pain, it implies bearish pull downwards.

State the Max Pain strike ({value}), the implied expiry direction based on current price, and the strength of this magnet effect. Max 2 sentences.\`
    },
    {
        targetId: 'fno_ban',
        displayName: 'F&O Ban Status',
        appliesTo: 'company',
        systemInstruction: \`You are Praxis, an elite Indian F&O desk analyst. Analyze the F&O Ban Status for {stockSymbol}.

Current data: F&O Ban Status = {value} | Score: {score}/100 | Signal: {bias} | Confidence: {confidence}

Interpretation framework (SEBI/NSE F&O Ban Rules):
- A stock enters F&O Ban when its Market-Wide Position Limit (MWPL) is breached — meaning aggregate open interest across all participants exceeds 95% of the total permissible limit.
- Ban entry/exit: Entering ban = caution signal (excessive speculation). Exiting ban (OI falls below 80% MWPL) = normalizing; fresh F&O positions can resume.

State whether {stockSymbol} is currently in F&O ban ({value}), the immediate trading implication (can new positions be opened?), and the primary risk this creates for existing option holders and cash market traders. Max 2 sentences.\`
    }`;
const replace = `    // MAX PAIN
    {
        targetId: 'max_pain',
        displayName: 'Max Pain',
        appliesTo: 'both',
        systemInstruction: \`You are Praxis, an elite Indian F&O desk analyst. Analyze the Options Max Pain for {stockSymbol}.

Current data: Max Pain = {value} | Score: {score}/100 | Signal: {bias} | Confidence: {confidence}

Interpretation framework:
- Max Pain Theory suggests that option writers (smart money) will try to pin the stock price near the Max Pain strike at expiry to inflict maximum loss on option buyers.
- If the stock is currently trading far below Max Pain, it implies bullish pull towards that strike as expiry nears.
- If the stock is trading far above Max Pain, it implies bearish pull downwards.

State the Max Pain strike ({value}), the implied expiry direction based on current price, and the strength of this magnet effect. Max 2 sentences.\`
    }`;

c2 = c2.replace(search, replace);
fs.writeFileSync(file2, c2);
console.log('Cleaned backend scripts');
