import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(/const stmt = db\.prepare\('SELECT \* FROM submissions ORDER BY createdAt DESC'\);/, "const stmt = db.prepare('SELECT * FROM submissions ORDER BY code ASC');");

fs.writeFileSync('server.ts', code);
