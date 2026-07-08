import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');

const seedCode = `
const prefixes = [
  'TI11A', 'TI11B', 'TI11C', 'TI11D', 'TI12A',
  'TIL21A', 'TIL21B', 'TIC21A', 'TIC21B', 'TIT21A', 'TIT21B', 'LCT21C',
  'TFC22A', 'TFC22B',
  'TIL31A', 'TIL31B', 'TIC31A', 'TIC31B', 'TIT31A', 'TIT31B',
  'TFC32A', 'TFC32B'
];

try {
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM submissions');
  const countRow = countStmt.get() as { count: number };
  if (countRow.count === 0 || countRow.count === 1) { // 1 is from the test we just did
    console.log('Seeding database with pre-allocated codes...');
    const insertStmt = db.prepare(\`
      INSERT OR IGNORE INTO submissions (code, type, members, rut, firstName, middleName, lastName, secondLastName, email, workshop, projectName, projectDescription, materials)
      VALUES (?, 'individual', '[]', '', '', '', '', '', '', '', '', '', '')
    \`);
    
    db.transaction(() => {
      for (const prefix of prefixes) {
        for (let i = 1; i <= 40; i++) {
          const code = \`\${prefix}\${i.toString().padStart(2, '0')}\`;
          insertStmt.run(code);
        }
      }
    })();
    console.log('Seeding complete.');
  }
} catch (e) {
  console.error('Error seeding DB:', e);
}
`;

code = code.replace(/function getPrefixForWorkshop/, seedCode + '\nfunction getPrefixForWorkshop');

code = code.replace(/const countQuery = db\.prepare\('SELECT COUNT\(\*\) as count FROM submissions WHERE code LIKE \?'\);\s*const countResult = countQuery\.get\(`\$\{prefix\}%`\) as \{ count: number \};\s*const nextNum = \(countResult\.count \+ 1\)\.toString\(\)\.padStart\(2, '0'\);\s*const code = `\$\{prefix\}\$\{nextNum\}`;\s*const stmt = db\.prepare\(`\s*INSERT INTO submissions \(code, type, members, rut, firstName, middleName, lastName, secondLastName, email, workshop, projectName, projectDescription, materials\)\s*VALUES \(\?, \?, \?, \?, \?, \?, \?, \?, \?, \?, \?, \?, \?\)\s*`\);\s*stmt\.run\(\s*code,\s*type,\s*members,\s*rut,\s*firstName,\s*middleName \|\| '',\s*lastName,\s*secondLastName,\s*email,\s*workshop,\s*projectName,\s*projectDescription,\s*materials\s*\);/, `
    const findStmt = db.prepare('SELECT code FROM submissions WHERE code LIKE ? AND email = "" ORDER BY code ASC LIMIT 1');
    const row = findStmt.get(\`\${prefix}%\`) as { code: string } | undefined;
    
    if (!row) {
      return res.status(400).json({ error: 'No hay cupos disponibles para esta sección.' });
    }
    
    const code = row.code;

    const stmt = db.prepare(\`
      UPDATE submissions 
      SET type = ?, members = ?, rut = ?, firstName = ?, middleName = ?, lastName = ?, secondLastName = ?, email = ?, workshop = ?, projectName = ?, projectDescription = ?, materials = ?, createdAt = CURRENT_TIMESTAMP
      WHERE code = ?
    \`);
    
    stmt.run(
      type,
      members,
      rut,
      firstName,
      middleName || '',
      lastName,
      secondLastName,
      email,
      workshop,
      projectName,
      projectDescription,
      materials,
      code
    );`);

fs.writeFileSync('server.ts', code);
