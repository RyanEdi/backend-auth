/**
 * Constantes da aplicação
 */

// Número de rounds para o bcrypt (quanto maior, mais seguro e mais lento)
const parsedSaltRounds = Number(process.env.SALT_ROUNDS);
export const SALT_ROUNDS = Number.isInteger(parsedSaltRounds)
  ? Math.min(Math.max(parsedSaltRounds, 8), 15)
  : (process.env.NODE_ENV === 'production' ? 12 : 8);

// CPFs de administradores (lido do .env, separados por vírgula)
export const ADMIN_CPFS = (process.env.ADMIN_CPFS || '')
  .split(',')
  .map(cpf => cpf.trim())
  .filter(Boolean);

// Secret para HMAC do CPF (definir no .env)
export const CPF_SECRET = process.env.CPF_SECRET || 'cpf_secret_juridico';

// Secret para criptografia de email (definir no .env)
export const EMAIL_SECRET = process.env.EMAIL_SECRET || 'email_secret_juridico';
