import { verifySync, TOTP } from 'otplib';

const secret = 'FJ4M24V4SJLU2TNFVGAMHCRX4DCOCUA7';
const token = '123456'; // invalid token

console.log('--- OTP LIB DIAGNOSTIC ---');

console.log('1. Testing verifySync with INVALID token...');
try {
    const res = verifySync({ token, secret });
    console.log('   Result:', res);
    console.log('   Type:', typeof res);
    console.log('   Is Object?', typeof res === 'object');
    if (typeof res === 'object' && res !== null) console.log('   Keys:', Object.keys(res));
} catch (e) {
    console.log('   Error:', e.message);
}n

console.log('\n2. Testing TOTP class with INVALID token...');
try {
    const totp = new TOTP();
    const res2 = totp.verify({ token, secret });
    console.log('   Result:', res2);
} catch (e) {
    console.log('   Error:', e.message);
}
