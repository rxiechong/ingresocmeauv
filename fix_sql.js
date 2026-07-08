import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(/AND email = ""/, "AND email = ''");
fs.writeFileSync('server.ts', code);
