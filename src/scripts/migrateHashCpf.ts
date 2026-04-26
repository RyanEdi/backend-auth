/**
 * Script de migração: re-hasheia CPFs plaintext para HMAC-SHA256
 * 
 * Executa UMA VEZ para corrigir contas cadastradas antes da implementação do hash.
 * Identifica CPFs com 11 dígitos (plaintext) e os atualiza para o hash.
 * 
 * Uso: npx tsx src/scripts/migrateHashCpf.ts
 */
import dotenv from 'dotenv';
import path from 'path';
import pool from '../config/database';
import { hashCpf } from '../utils/sanitizers';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function migrateHashCpf() {
  console.log('🔄 Iniciando migração de CPFs plaintext → hash...');

  try {
    // Busca usuários com CPF de 11 dígitos (plaintext não hashado)
    const result = await pool.query(
      `SELECT id, cpf FROM usuarios_adv WHERE cpf ~ '^[0-9]{11}$'`
    );

    if (result.rows.length === 0) {
      console.log('✅ Nenhum CPF plaintext encontrado. Migração não necessária.');
      return;
    }

    console.log(`📋 Encontrados ${result.rows.length} CPF(s) para migrar.`);

    let successCount = 0;
    let errorCount = 0;

    for (const row of result.rows) {
      try {
        const hashed = hashCpf(row.cpf);
        await pool.query(
          'UPDATE usuarios_adv SET cpf = $1 WHERE id = $2',
          [hashed, row.id]
        );
        console.log(`  ✅ Usuário ID ${row.id} migrado.`);
        successCount++;
      } catch (err) {
        console.error(`  ❌ Erro ao migrar usuário ID ${row.id}:`, err);
        errorCount++;
      }
    }

    console.log(`\n🏁 Migração concluída: ${successCount} sucesso(s), ${errorCount} erro(s).`);
  } catch (err) {
    console.error('❌ Erro na migração:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrateHashCpf();
