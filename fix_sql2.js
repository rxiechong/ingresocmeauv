import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(/const findStmt = db\.prepare\('SELECT code FROM submissions WHERE code LIKE \? AND email = '' ORDER BY code ASC LIMIT 1'\);/, "const findStmt = db.prepare(`SELECT code FROM submissions WHERE code LIKE ? AND email = '' ORDER BY code ASC LIMIT 1`);");
fs.writeFileSync('server.ts', code);
