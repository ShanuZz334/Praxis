const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found!');
    process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const vars = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        vars[parts[0].trim()] = parts[1].trim();
    }
});

const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
let missing = false;

console.log('--- Checking Email Configuration ---');
required.forEach(key => {
    if (!vars[key]) {
        console.error(`❌ Missing: ${key}`);
        missing = true;
    } else {
        console.log(`✅ Present: ${key}`);
    }
});

if (missing) {
    console.log('\nPlease add the missing variables to your .env file.');
} else {
    console.log('\nConfiguration present. If email still fails, check credentials validity.');
}
