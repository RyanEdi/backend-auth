/**
 * Funções de sanitização e validação
 */
import crypto from 'crypto';
import { CPF_SECRET, EMAIL_SECRET } from '../config/constants';

// HMAC-SHA256 para CPF (determinístico, permite busca por igualdade)
export const hashCpf = (cpf: string): string => {
  return crypto.createHmac('sha256', CPF_SECRET).update(cpf).digest('hex');
};

// HMAC-SHA256 para email (determinístico, permite busca/unicidade)
export const hashEmail = (email: string): string => {
  return crypto.createHmac('sha256', EMAIL_SECRET).update(email.toLowerCase()).digest('hex');
};

// AES-256-CBC para criptografar email (reversível)
export const encryptEmail = (email: string): string => {
  const key = crypto.createHash('sha256').update(EMAIL_SECRET).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(email.toLowerCase(), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
};

// AES-256-CBC para descriptografar email
export const decryptEmail = (encryptedEmail: string): string => {
  const key = crypto.createHash('sha256').update(EMAIL_SECRET).digest();
  const [ivHex, encrypted] = encryptedEmail.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

// Remove todos os caracteres não numéricos
export const onlyDigits = (value: string | undefined | null): string => {
  return (value || '').replace(/\D/g, '');
};

// Remove espaços em branco do início e fim
export const sanitizeText = (value: string | undefined | null): string => {
  return (value || '').trim();
};

// Regex para validação de senha
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

// Regex para validação de email
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const MX_CACHE_TTL_MS = 30 * 60 * 1000; // 30 min
const MX_TIMEOUT_MS = 1200; // 1.2s
const domainMxCache = new Map<string, { valid: boolean; expiresAt: number }>();

// Valida formato do email
export const isValidEmail = (email: string): boolean => {
  return EMAIL_REGEX.test(email);
};

// Verifica se o domínio do email tem registros MX (aceita receber emails)
export const checkEmailDomain = async (email: string): Promise<boolean> => {
  const dns = await import('dns');
  const domain = (email.split('@')[1] || '').toLowerCase();

  if (!domain) {
    return false;
  }

  const cached = domainMxCache.get(domain);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.valid;
  }

  try {
    const resolver = new dns.promises.Resolver();
    resolver.setServers(['8.8.8.8', '1.1.1.1']);
    const records = await Promise.race([
      resolver.resolveMx(domain),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('DNS_TIMEOUT')), MX_TIMEOUT_MS);
      }),
    ]);

    const valid = !!(records && records.length > 0);
    domainMxCache.set(domain, { valid, expiresAt: Date.now() + MX_CACHE_TTL_MS });
    return valid;
  } catch (err: any) {
    // Falhas de rede/DNS público não devem bloquear cadastro;
    // apenas domínios realmente inexistentes retornam falso.
    const code = err?.code || err?.message;
    if (code === 'ENOTFOUND' || code === 'ENODATA' || code === 'NXDOMAIN') {
      domainMxCache.set(domain, { valid: false, expiresAt: Date.now() + MX_CACHE_TTL_MS });
      return false;
    }

    return true;
  }
};

// Validação de senha
// Requisitos: mínimo 8 caracteres, 1 maiúscula, 1 minúscula, 1 número
export const validatePassword = (senha: string): { valid: boolean; message: string } => {
  if (!senha || senha.length < 8) {
    return { valid: false, message: 'A senha deve ter no mínimo 8 caracteres.' };
  }
  if (!/[a-z]/.test(senha)) {
    return { valid: false, message: 'A senha deve conter pelo menos uma letra minúscula.' };
  }
  if (!/[A-Z]/.test(senha)) {
    return { valid: false, message: 'A senha deve conter pelo menos uma letra maiúscula.' };
  }
  if (!/\d/.test(senha)) {
    return { valid: false, message: 'A senha deve conter pelo menos um número.' };
  }
  return { valid: true, message: '' };
};
