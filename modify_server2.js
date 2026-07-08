import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/\/\/ Set up Nodemailer transporter[\s\S]*?\}\);\n/, '');

fs.writeFileSync('server.ts', code);
