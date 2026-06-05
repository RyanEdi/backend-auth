/**
 * Rotas de Cadastro de Usuário
 */
import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import pool from '../../config/database';
import { SALT_ROUNDS } from '../../config/constants';
import { upload } from '../../middlewares/upload';
import { onlyDigits, sanitizeText, validatePassword, hashCpf, hashEmail, encryptEmail, isValidEmail } from '../../utils/sanitizers';
import { sendEmailVerificationCode, sendPendingAnalysisEmail } from '../../services/emailService';
import logger from '../../utils/logger';

// Gera código de 6 dígitos
function generateVerificationCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

const router = Router();

// POST /salvar - Cadastro de novo usuário com upload de foto OAB
router.post('/salvar', upload.single('foto_oab'), async (req: Request, res: Response) => {
  logger.debug('POST /salvar recebido', { fields: Object.keys(req.body), hasFile: !!req.file });
  const nome_completo = sanitizeText(req.body.nome_completo);
  const email = sanitizeText(req.body.email).toLowerCase();
  const senha = sanitizeText(req.body.senha);
  const data_nascimento = sanitizeText(req.body.data_nascimento);
  const cpf = onlyDigits(req.body.cpf);
  const numero_oab = onlyDigits(req.body.numero_oab);
  const estado_oab = sanitizeText(req.body.estado_oab).toUpperCase();
  const payment_reference = sanitizeText(req.body.payment_reference || '').slice(0, 120) || null;

  const foto_oab_buffer = req.file ? req.file.buffer : null;
  const foto_oab_tipo = req.file ? req.file.mimetype : null;

  if (!nome_completo || !email || !senha || !data_nascimento || !cpf) {
    return res.status(400).send('Preencha todos os campos obrigatórios.');
  }

  // Validação de email
  if (!isValidEmail(email)) {
    return res.status(400).send('Formato de e-mail inválido.');
  }

  // Validação de senha
  const senhaValidation = validatePassword(senha);
  if (!senhaValidation.valid) {
    return res.status(400).send(senhaValidation.message);
  }

  if (cpf.length !== 11) {
    return res.status(400).send('CPF inválido.');
  }

  if (!numero_oab || !estado_oab) {
    // ambos opcionais — segue sem bloquear
  }

  if (!foto_oab_buffer) {
    // foto opcional — segue sem bloquear
  }

  try {
    const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);

    const cpfHash = hashCpf(cpf);

    const emailEncrypted = encryptEmail(email);
    const emailHash = hashEmail(email);

    // Gerar código de verificação (expira em 15 minutos)
    const verificationCode = generateVerificationCode();
    const verificationCodeHash = await bcrypt.hash(verificationCode, SALT_ROUNDS);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    const result = await pool.query(
      `INSERT INTO usuarios_adv (nome_completo, email_encrypted, email_hash, senha, data_nascimento, cpf, numero_oab, estado_oab, foto_oab, foto_oab_tipo, email_verified, email_verification_code, email_verification_expires, payment_status, payment_reference)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, FALSE, $11, $12, 'pending', $13)
       RETURNING id`,
      [nome_completo, emailEncrypted, emailHash, senhaHash, data_nascimento, cpfHash, numero_oab, estado_oab, foto_oab_buffer, foto_oab_tipo, verificationCodeHash, expiresAt, payment_reference]
    );

    // Enviar código de verificação por email
    // Enviar código de verificação por email (sem bloquear a resposta)
    sendEmailVerificationCode(email, nome_completo, verificationCode).catch(err =>
      logger.error('Erro ao enviar email de verificação', { error: (err as Error).message })
    );

    // Retorna payload completo para o frontend decidir o redirecionamento
    const userId = result.rows[0].id;
    return res.status(201).json({
      success: true,
      id: userId,
      redirectTo: `/verificar-email?id=${userId}`,
    });
  } catch (err: any) {
    if (err.code === '23505') { // Unique violation
      const detail: string = err.detail || '';
      if (detail.includes('cpf')) {
        return res.status(409).send('Já existe usuário com este CPF.');
      }
      if (detail.includes('numero_oab')) {
        return res.status(409).send('Já existe usuário com este número da OAB.');
      }
      if (detail.includes('email_hash')) {
        return res.status(409).send('Já existe usuário com este e-mail.');
      }
      return res.status(409).send('Já existe usuário com estes dados.');
    }
    logger.error('Erro ao cadastrar', { code: err.code, message: err.message });
    res.status(400).send('Erro ao cadastrar: ' + err.message);
  }
});

// POST /verificar-email - Verifica o código enviado por email
router.post('/verificar-email', async (req: Request, res: Response) => {
  const { id, code } = req.body;

  if (!id || !code) {
    return res.status(400).json({ success: false, message: 'ID e código são obrigatórios.' });
  }

  try {
    const result = await pool.query(
      'SELECT id, nome_completo, email_encrypted, email_verification_code, email_verification_expires, email_verified FROM usuarios_adv WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
    }

    const usuario = result.rows[0];

    if (usuario.email_verified) {
      return res.status(400).json({ success: false, message: 'E-mail já verificado.' });
    }

    // Verificar se o código expirou
    if (new Date() > new Date(usuario.email_verification_expires)) {
      return res.status(400).json({ success: false, message: 'Código expirado. Solicite um novo código.' });
    }

    // Verificar se o código está correto
    const codeValid = await bcrypt.compare(code.trim(), usuario.email_verification_code);
    if (!codeValid) {
      return res.status(400).json({ success: false, message: 'Código inválido.' });
    }

    // Marcar email como verificado e limpar código
    await pool.query(
      'UPDATE usuarios_adv SET email_verified = TRUE, email_verification_code = NULL, email_verification_expires = NULL WHERE id = $1',
      [id]
    );

    // Agora enviar o email de "pendente de análise"
    const { decryptEmail } = await import('../../utils/sanitizers');
    const email = decryptEmail(usuario.email_encrypted);
    sendPendingAnalysisEmail(email, usuario.nome_completo).catch(err =>
      logger.error('Erro ao enviar email de pendente de análise', { error: (err as Error).message })
    );

    return res.status(200).json({ success: true, redirectTo: `/pagamento?id=${id}` });
  } catch (err) {
    console.error('Erro ao verificar email:', err);
    return res.status(500).json({ success: false, message: 'Erro ao verificar e-mail. Tente novamente.' });
  }
});

// POST /reenviar-codigo - Reenvia o código de verificação
router.post('/reenviar-codigo', async (req: Request, res: Response) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ success: false, message: 'ID é obrigatório.' });
  }

  try {
    const result = await pool.query(
      'SELECT id, nome_completo, email_encrypted, email_verified FROM usuarios_adv WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
    }

    const usuario = result.rows[0];

    if (usuario.email_verified) {
      return res.status(400).json({ success: false, message: 'E-mail já verificado.' });
    }

    // Gerar novo código
    const verificationCode = generateVerificationCode();
    const verificationCodeHash = await bcrypt.hash(verificationCode, SALT_ROUNDS);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await pool.query(
      'UPDATE usuarios_adv SET email_verification_code = $1, email_verification_expires = $2 WHERE id = $3',
      [verificationCodeHash, expiresAt, id]
    );

    const { decryptEmail } = await import('../../utils/sanitizers');
    const email = decryptEmail(usuario.email_encrypted);
    sendEmailVerificationCode(email, usuario.nome_completo, verificationCode).catch(err =>
      logger.error('Erro ao reenviar código de verificação', { error: (err as Error).message })
    );

    return res.status(200).json({ success: true, message: 'Novo código enviado com sucesso.' });
  } catch (err) {
    console.error('Erro ao reenviar código:', err);
    return res.status(500).json({ success: false, message: 'Erro ao reenviar código. Tente novamente.' });
  }
});

export default router;
