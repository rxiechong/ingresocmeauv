import fs from 'fs';
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'database.sqlite');
const db = new Database(dbPath);

const prefix = 'TI11A';
const type = 'individual';
const members = '[]';
const rut = '11111111';
const firstName = 'Test';
const middleName = '';
const lastName = 'Test';
const secondLastName = 'Test';
const email = 'test1@estudiantes.uv.cl';
const workshop = 'TI11 - 1A — Taller Integrado 1A (Romina Araya + Enrique Rivadeneira)';
const projectName = 'Test';
const projectDescription = 'Test';
const materials = 'Test';

try {
    const findStmt = db.prepare('SELECT code FROM submissions WHERE code LIKE ? AND email = "" ORDER BY code ASC LIMIT 1');
    const row = findStmt.get(`${prefix}%`);
    console.log('Row found:', row);

    if (!row) {
        throw new Error('No hay cupos disponibles para esta sección.');
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
    console.log('Update successful, code:', code);
} catch (e) {
    console.error('Error:', e);
}
