import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/app\.post\('\/api\/submissions', async \(req, res\) => \{[\s\S]*?res\.status\(500\)\.json\(\{ error: 'Failed to submit form' \}\);\n  \}\n\}\);/, `app.post('/api/submissions', async (req, res) => {
  try {
    const {
      type = 'individual',
      members = '[]',
      rut,
      firstName,
      middleName,
      lastName,
      secondLastName,
      email,
      workshop,
      projectName,
      projectDescription,
      materials,
    } = req.body;

    const prefix = getPrefixForWorkshop(workshop);

    const countQuery = db.prepare('SELECT COUNT(*) as count FROM submissions WHERE code LIKE ?');
    const countResult = countQuery.get(\`\${prefix}%\`) as { count: number };
    
    const nextNum = (countResult.count + 1).toString().padStart(2, '0');
    const code = \`\${prefix}\${nextNum}\`;

    const stmt = db.prepare(\`
      INSERT INTO submissions (code, type, members, rut, firstName, middleName, lastName, secondLastName, email, workshop, projectName, projectDescription, materials)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    \`);
    
    stmt.run(
      code,
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
      materials
    );

    res.json({ success: true, code });
  } catch (error) {
    console.error('Error submitting form:', error);
    res.status(500).json({ error: 'Failed to submit form' });
  }
});`);

code = code.replace(/app\.put\('\/api\/submissions\/:code', \(req, res\) => \{[\s\S]*?res\.status\(500\)\.json\(\{ error: 'Error al actualizar el registro' \}\);\n  \}\n\}\);/, `app.put('/api/submissions/:code', (req, res) => {
  try {
    const { code } = req.params;
    const {
      type = 'individual',
      members = '[]',
      rut,
      firstName,
      middleName,
      lastName,
      secondLastName,
      email,
      workshop,
      projectName,
      projectDescription,
      materials,
    } = req.body;

    const stmt = db.prepare(\`
      UPDATE submissions
      SET type = ?, members = ?, rut = ?, firstName = ?, middleName = ?, lastName = ?, secondLastName = ?, email = ?, workshop = ?, projectName = ?, projectDescription = ?, materials = ?
      WHERE code = ?
    \`);
    const result = stmt.run(
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
    );
    if (result.changes > 0) {
      res.json({ success: true, code });
    } else {
      res.status(404).json({ error: 'Registro no encontrado' });
    }
  } catch (error) {
    console.error('Error updating form:', error);
    res.status(500).json({ error: 'Error al actualizar el registro' });
  }
});`);

fs.writeFileSync('server.ts', code);
