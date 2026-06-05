/**
 * Rotas de Gerenciamento de Senha
 */
import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import pool from '../../config/database';
import { SALT_ROUNDS } from '../../config/constants';
import { onlyDigits, sanitizeText, validatePassword, hashCpf, decryptEmail } from '../../utils/sanitizers';
import { sendPasswordChangedEmail } from '../../services/emailService';
import logger from '../../utils/logger';

const router = Router();

// POST /atualizar-senha - Atualização de senha (por CPF)
router.post('/atualizar-senha', async (req: Request, res: Response) => {
  const cpf = onlyDigits(req.body.cpf);
  const nova_senha = sanitizeText(req.body.nova_senha);
  const confirma_senha = sanitizeText(req.body.confirma_senha);

  if (!cpf || !nova_senha || !confirma_senha) {
    return res.status(400).json({ error: 'Campos obrigatórios não informados.' });
  }

  if (cpf.length !== 11) {
    return res.status(400).json({ error: 'CPF inválido.' });
  }

  // Validação de senha com regex
  const senhaValidation = validatePassword(nova_senha);
  if (!senhaValidation.valid) {
    return res.status(400).json({ error: senhaValidation.message });
  }

  if (nova_senha !== confirma_senha) {
    return res.status(400).json({ error: 'As senhas não coincidem.' });
  }

  try {
    // Buscar dados do usuário para enviar email (CPF hashado)
    const cpfHash = hashCpf(cpf);
    const usuarioResult = await pool.query(
      'SELECT nome_completo, email_encrypted FROM usuarios_adv WHERE cpf = $1',
      [cpfHash]
    );

    if (!usuarioResult.rows[0]) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const { nome_completo, email_encrypted } = usuarioResult.rows[0];
    const email = decryptEmail(email_encrypted);

    // Gerar hash da nova senha com bcrypt
    const senhaHash = await bcrypt.hash(nova_senha, SALT_ROUNDS);

    const resultado = await pool.query(
      'UPDATE usuarios_adv SET senha = $1 WHERE cpf = $2',
      [senhaHash, cpfHash]
    );

    if (resultado.rowCount && resultado.rowCount > 0) {
      // Enviar email de confirmação de alteração de senha
      sendPasswordChangedEmail(email, nome_completo)
        .then((sent) => {
          if (!sent) {
            logger.warn('Email de alteração de senha não foi enviado', { cpf });
          }
        })
        .catch((err) => {
          logger.error('Erro ao enviar email de alteração de senha', { error: (err as Error).message });
        });

      return res.status(200).json({ success: true, message: 'Senha atualizada com sucesso!' });
    } else {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }
  } catch (err) {
    logger.error('Erro ao atualizar senha', { error: (err as Error).message });
    return res.status(500).json({ error: 'Erro ao processar a atualização.' });
  }
});

export default router;
