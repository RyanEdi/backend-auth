require('dotenv').config();
const crypto = require('crypto');
const { Pool } = require('pg');
const p = new Pool({
  host: process.env.DB_HOST,
  port: +process.env.DB_PORT || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

function hashEmail(email) {
  return crypto.createHmac('sha256', process.env.EMAIL_SECRET).update(email.toLowerCase()).digest('hex');
}

function encryptEmail(email) {
  const key = crypto.createHash('sha256').update(process.env.EMAIL_SECRET).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(email.toLowerCase(), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

async function run() {
  try {
    if (!process.env.EMAIL_SECRET) {
      console.error('EMAIL_SECRET nao definido no .env');
      process.exit(1);
    }

    // Buscar usuarios com e-mail em texto simples e sem email_encrypted
    const result = await p.query(
      "SELECT id, email FROM usuarios_adv WHERE email IS NOT NULL AND email != '' AND (email_encrypted IS NULL OR email_encrypted = '')"
    );

    console.log(`Encontrados ${result.rows.length} usuarios para migrar.`);

    for (const row of result.rows) {
      const enc = encryptEmail(row.email);
      const hash = hashEmail(row.email);
      await p.query(
        'UPDATE usuarios_adv SET email_encrypted = $1, email_hash = $2 WHERE id = $3',
        [enc, hash, row.id]
      );
      console.log(`  Migrado ID ${row.id}: ${row.email}`);
    }

    console.log('Migracao concluida!');
    console.log('\nAgora voce pode remover a coluna email com o usuario dono:');
    console.log('  ALTER TABLE usuarios_adv DROP COLUMN email;');
  } catch (e) {
    console.error('Erro:', e.message);
  } finally {
    p.end();
  }
}
run();
