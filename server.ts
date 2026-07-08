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
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

try {
  db.exec('ALTER TABLE submissions ADD COLUMN rut TEXT DEFAULT ""');
} catch (e) {
  // Column might already exist
}

// Set up Nodemailer transporter (for preview, we will log if not configured)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER || 'ethereal.user@ethereal.email',
    pass: process.env.SMTP_PASS || 'ethereal-pass',
  },
});

function getPrefixForWorkshop(workshop: string): string {
  if (workshop.includes('TI11 - 1A')) return 'TI11A';
  if (workshop.includes('TI11 - 1B')) return 'TI11B';
  if (workshop.includes('TI11 - 1C')) return 'TI11C';
  if (workshop.includes('TI11 - 1D')) return 'TI11D';
  if (workshop.includes('TI12 - U')) return 'TI12A';
  
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
    const countResult = countQuery.get(`${prefix}%`) as { count: number };
    const nextNum = (countResult.count + 1).toString().padStart(2, '0');
    const code = `${prefix}${nextNum}`;

    const stmt = db.prepare(`
      INSERT INTO submissions (code, rut, firstName, middleName, lastName, secondLastName, email, workshop, projectName, projectDescription, materials)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      code,
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

    // Send email
    let emailSent = false;
    try {
      if (process.env.SMTP_HOST) {
        await transporter.sendMail({
          from: '"Taller Integrado UV" <noreply@estudiantes.uv.cl>',
          to: email,
          subject: 'Código de Confirmación - Taller Integrado',
          text: `Hola ${firstName},\n\nTu formulario ha sido recibido con éxito. Tu código de confirmación es: ${code}\n\nSaludos,\nEquipo Taller Integrado UV.`,
        });
        emailSent = true;
      } else {
        console.log(`[Email Mock] Would send email to ${email} with code ${code}`);
        emailSent = true;
      }
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
    }

    res.json({ success: true, code, emailSent });
  } catch (error) {
    console.error('Error submitting form:', error);
    res.status(500).json({ error: 'Failed to submit form' });
  }
});

app.get('/api/submissions/export', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM submissions ORDER BY createdAt DESC');
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
    const { code, email } = req.body;
    const stmt = db.prepare('SELECT * FROM submissions WHERE code = ? AND email = ?');
    const row = stmt.get(code, email);
    
    if (row) {
      res.json({ success: true, submission: row });
    } else {
      res.status(404).json({ error: 'No se encontró un registro con ese código y correo.' });
    }
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ error: 'Error al buscar el registro' });
  }
});

app.post('/api/submissions/recover', (req, res) => {
  try {
    const { email } = req.body;
    const stmt = db.prepare('SELECT code FROM submissions WHERE email = ?');
    const rows = stmt.all(email) as { code: string }[];
    
    if (rows.length > 0) {
      res.json({ success: true, code: rows[rows.length - 1].code });
    } else {
      res.status(404).json({ error: 'No se encontraron registros con ese correo.' });
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
      SET rut = ?, firstName = ?, middleName = ?, lastName = ?, secondLastName = ?, email = ?, workshop = ?, projectName = ?, projectDescription = ?, materials = ?
      WHERE code = ?
    `);

    const result = stmt.run(
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
