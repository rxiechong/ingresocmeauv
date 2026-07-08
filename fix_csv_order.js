import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(/const stmt = db\.prepare\('SELECT \* FROM submissions ORDER BY createdAt DESC'\);\s*const rows = stmt\.all\(\);\s*const csv = Papa\.unparse\(rows\);/, `const stmt = db.prepare('SELECT * FROM submissions ORDER BY code ASC');
    const rows = stmt.all();
    const csv = Papa.unparse(rows);`);

fs.writeFileSync('server.ts', code);
