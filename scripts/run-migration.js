import { pool } from '../src/config/db.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  const migrationFile = process.argv[2];

  if (!migrationFile) {
    console.error('Uso: node scripts/run-migration.js <archivo_migracion>');
    console.error('Ejemplo: node scripts/run-migration.js migrations/002_auth_logs.sql');
    process.exit(1);
  }

  const migrationPath = join(__dirname, '..', migrationFile);

  try {
    console.log(`📄 Leyendo migración: ${migrationFile}`);
    const sql = readFileSync(migrationPath, 'utf8');

    // Dividir por statements (separados por ;)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`🚀 Ejecutando ${statements.length} statements...\n`);

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      const preview = stmt.substring(0, 60).replace(/\n/g, ' ');

      try {
        await pool.query(stmt);
        console.log(`✅ [${i + 1}/${statements.length}] ${preview}...`);
      } catch (err) {
        // Ignorar errores de "ya existe"
        if (err.code === 'ER_TABLE_EXISTS_ERROR' || err.code === 'ER_DUP_KEYNAME') {
          console.log(`⏭️  [${i + 1}/${statements.length}] Ya existe, saltando...`);
        } else {
          console.error(`❌ [${i + 1}/${statements.length}] Error: ${err.message}`);
        }
      }
    }

    console.log('\n✅ Migración completada');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

runMigration();
