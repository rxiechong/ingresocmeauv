import express from 'express';
import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';
import nodemailer from 'nodemailer';
import Papa from 'papaparse';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
app.use(express.json());
const PORT = 3000;

// Set up the database
const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'data', 'database.sqlite');
const dataDir = path.dirname(dbPath);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    firstName TEXT NOT NULL,
    middleName TEXT,
    lastName TEXT NOT NULL,
    secondLastName TEXT NOT NULL,
    email TEXT NOT NULL,
    workshop TEXT NOT NULL,
    projectName TEXT NOT NULL,
    projectDescription TEXT NOT NULL,
    materials TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    type TEXT DEFAULT "individual",
    members TEXT DEFAULT "[]",
    rut TEXT DEFAULT ""
  )
`);
try {
  db.exec('ALTER TABLE submissions ADD COLUMN type TEXT DEFAULT "individual"');
} catch (e) {}
try {
  db.exec('ALTER TABLE submissions ADD COLUMN members TEXT DEFAULT "[]"');
} catch (e) {}


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
    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO submissions (code, type, members, rut, firstName, middleName, lastName, secondLastName, email, workshop, projectName, projectDescription, materials)
      VALUES (?, 'individual', '[]', '', '', '', '', '', '', '', '', '', '')
    `);
    
    db.transaction(() => {
      for (const prefix of prefixes) {
        for (let i = 1; i <= 40; i++) {
          const code = `${prefix}${i.toString().padStart(2, '0')}`;
          insertStmt.run(code);
        }
      }
    })();
    console.log('Seeding complete.');
  }
} catch (e) {
  console.error('Error seeding DB:', e);
}

function getPrefixForWorkshop(workshop: string): string {
  if (workshop.includes('TI11 - 1A')) return 'TI11A';
  if (workshop.includes('TI11 - 1B')) return 'TI11B';
  if (workshop.includes('TI11 - 1C')) return 'TI11C';
  if (workshop.includes('TI11 - 1D')) return 'TI11D';
  if (workshop.includes('TI12 —')) return 'TI12A';
  
  if (workshop.includes('TIL21 - 1A')) return 'TIL21A';
  if (workshop.includes('TIL21 - 1B')) return 'TIL21B';
  if (workshop.includes('TIC21 - 1A')) return 'TIC21A';
  if (workshop.includes('TIC21 - 1B')) return 'TIC21B';
  if (workshop.includes('TIT21 - 1A')) return 'TIT21A';
  if (workshop.includes('TIT21 - 1B')) return 'TIT21B';
  if (workshop.includes('TIL-TIC-TIT21 - 1C')) return 'LCT21C';
  if (workshop.includes('TFC22 - 1A')) return 'TFC22A';
  if (workshop.includes('TFC22 - 1B')) return 'TFC22B';
  
  if (workshop.includes('TIL31 - A')) return 'TIL31A';
  if (workshop.includes('TIL31 - B')) return 'TIL31B';
  if (workshop.includes('TIC31 - A')) return 'TIC31A';
  if (workshop.includes('TIC31 - B')) return 'TIC31B';
  if (workshop.includes('TIT31 - A')) return 'TIT31A';
  if (workshop.includes('TIT31 - B')) return 'TIT31B';
  if (workshop.includes('TFC32 - A')) return 'TFC32A';
  if (workshop.includes('TFC32 - B')) return 'TFC32B';
  
  return 'UNK';
}

app.post('/api/submissions', async (req, res) => {
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

    
    const findStmt = db.prepare(`SELECT code FROM submissions WHERE code LIKE ? AND email = '' ORDER BY code ASC LIMIT 1`);
    const row = findStmt.get(`${prefix}%`) as { code: string } | undefined;
    
    if (!row) {
      return res.status(400).json({ error: 'No hay cupos disponibles para esta sección.' });
    }
    
    const code = row.code;

    const stmt = db.prepare(`
      UPDATE submissions 
      SET type = ?, members = ?, rut = ?, firstName = ?, middleName = ?, lastName = ?, secondLastName = ?, email = ?, workshop = ?, projectName = ?, projectDescription = ?, materials = ?, createdAt = CURRENT_TIMESTAMP
      WHERE code = ?
    `);
    
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
    );

    res.json({ success: true, code });
  } catch (error) {
    console.error('Error submitting form:', error);
    res.status(500).json({ error: 'Failed to submit form' });
  }
});

app.get('/api/submissions/export', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM submissions ORDER BY code ASC');
    const rows = stmt.all();

    const csv = Papa.unparse(rows);

    res.header('Content-Type', 'text/csv');
    res.attachment('inscripciones_taller_integrado.csv');
    res.send(csv);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

app.post('/api/submissions/login', (req, res) => {
  try {
    const { rut, email } = req.body;
    const stmt = db.prepare('SELECT * FROM submissions WHERE rut = ? AND email = ?');
    const row = stmt.get(rut, email);
    
    if (row) {
      res.json({ success: true, submission: row });
    } else {
      res.status(404).json({ error: 'No se encontró un registro con ese RUT y correo.' });
    }
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ error: 'Error al buscar el registro' });
  }
});

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'campos' && password === 'acceso') {
    res.json({ success: true, token: 'admin-token-valid' });
  } else {
    res.status(401).json({ error: 'Credenciales inválidas' });
  }
});

app.get('/api/admin/submissions', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader !== 'Bearer admin-token-valid') {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const stmt = db.prepare('SELECT * FROM submissions ORDER BY createdAt DESC');
    const rows = stmt.all();
    res.json({ success: true, submissions: rows });
  } catch (error) {
    console.error('Error fetching submissions for admin:', error);
    res.status(500).json({ error: 'Error al obtener registros' });
  }
});

app.post('/api/submissions/recover', (req, res) => {
  try {
    const { email, rut } = req.body;
    const stmt = db.prepare('SELECT code FROM submissions WHERE email = ? AND rut = ?');
    const rows = stmt.all(email, rut) as { code: string }[];
    
    if (rows.length > 0) {
      res.json({ success: true, code: rows[rows.length - 1].code });
    } else {
      res.status(404).json({ error: 'No se encontraron registros con ese correo y RUT.' });
    }
  } catch (error) {
    console.error('Error in recover:', error);
    res.status(500).json({ error: 'Error al buscar el código' });
  }
});

app.put('/api/submissions/:code', (req, res) => {
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

    const stmt = db.prepare(`
      UPDATE submissions
      SET type = ?, members = ?, rut = ?, firstName = ?, middleName = ?, lastName = ?, secondLastName = ?, email = ?, workshop = ?, projectName = ?, projectDescription = ?, materials = ?
      WHERE code = ?
    `);
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
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
