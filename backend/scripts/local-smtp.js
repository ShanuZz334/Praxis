import { SMTPServer } from 'smtp-server';
import { simpleParser } from 'mailparser';

const server = new SMTPServer({
    authOptional: true,
    onData(stream, session, callback) {
        simpleParser(stream, (err, mail) => {
            if (err) console.error('SMTP Parser Error:', err);

            console.log('\n=======================================');
            console.log('📬 NEW EMAIL RECEIVED BY LOCAL TRAP');
            console.log('From:', mail.from.text);
            console.log('To:', mail.to.text);
            console.log('Subject:', mail.subject);
            console.log('---------------------------------------');
            console.log('Content:', mail.text);
            console.log('=======================================\n');

            callback();
        });
    }
});

const PORT = 1025;
server.listen(PORT, () => {
    console.log(`🚀 Local SMTP Trap running on port ${PORT}`);
    console.log('Checking for incoming sign-up OTPs...');
});
