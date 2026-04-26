/**
 * Rotas de Administração de Usuários
 */
import { Router, Request, Response } from 'express';
import pool from '../../config/database';
import { decryptEmail } from '../../utils/sanitizers';
import {
  sendApprovalEmail,
  sendRejectionEmail,
  sendDeactivationEmail,
  sendReactivationEmail,
} from '../../services/emailService';

// Helper para descriptografar email do banco
const getEmail = (row: any): string => {
  return decryptEmail(row.email_encrypted);
};

const router = Router();

const parseIdParam = (idParam: string): number | null => {
  const parsedId = Number(idParam);
  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    return null;
  }
  return parsedId;
};

// GET /admin/pendentes - Lista usuários pendentes de aprovação
router.get('/pendentes', async (_req: Request, res: Response) => {
  try {
    const resultado = await pool.query(
      `SELECT id, nome_completo, email_encrypted, cpf, numero_oab, estado_oab, created_at
       FROM usuarios_adv
       WHERE verificado = FALSE AND email_verified = TRUE
       ORDER BY created_at DESC`
    );
    const rows = resultado.rows.map(r => ({ ...r, email: getEmail(r), email_encrypted: undefined }));
    res.json(rows);
  } catch (err) {
    console.error('Erro ao listar pendentes:', err);
    res.status(500).json({ error: 'Erro ao buscar usuários pendentes.' });
  }
});

// GET /admin/usuarios - Lista todos os usuários
router.get('/usuarios', async (_req: Request, res: Response) => {
  try {
    const resultado = await pool.query(
      `SELECT id, nome_completo, email_encrypted, cpf, numero_oab, estado_oab, verificado, ativo, created_at
       FROM usuarios_adv
       ORDER BY created_at DESC`
    );
    const rows = resultado.rows.map(r => ({ ...r, email: getEmail(r), email_encrypted: undefined }));
    res.json(rows);
  } catch (err) {
    console.error('Erro ao listar usuários:', err);
    res.status(500).json({ error: 'Erro ao buscar usuários.' });
  }
});

// POST /admin/aprovar/:id - Aprova um usuário
router.post('/aprovar/:id', async (req: Request, res: Response) => {
  const id = parseIdParam(req.params.id);

  if (!id) {
    return res.status(400).json({ error: 'ID inválido.' });
  }

  try {
    const resultado = await pool.query(
      'UPDATE usuarios_adv SET verificado = TRUE, ativo = TRUE WHERE id = $1 RETURNING nome_completo, email_encrypted',
      [id]
    );

    const usuario = resultado.rows[0];
    (resultado.rowCount ?? 0) > 0
      ? (await sendApprovalEmail(getEmail(usuario), usuario.nome_completo),
        res.json({
          success: true,
          message: `Usuário ${usuario.nome_completo} aprovado com sucesso! E-mail de aprovação enviado.`,
        }))
      : res.status(404).json({ error: 'Usuário não encontrado.' });
  } catch (err) {
    console.error('Erro ao aprovar usuário:', err);
    res.status(500).json({ error: 'Erro ao aprovar usuário.' });
  }
});

// POST /admin/rejeitar/:id - Rejeita/remove um usuário pendente
router.post('/rejeitar/:id', async (req: Request, res: Response) => {
  const id = parseIdParam(req.params.id);
  const motivo =
    typeof req.body?.motivo === 'string'
      ? req.body.motivo.trim().slice(0, 500)
      : '';

  if (!id) {
    return res.status(400).json({ error: 'ID inválido.' });
  }

  const client = await pool.connect();
  let inTransaction = false;

  try {
    await client.query('BEGIN');
    inTransaction = true;

    // Remove o usuário pendente e já devolve os dados para notificação
    const resultado = await client.query(
      'DELETE FROM usuarios_adv WHERE id = $1 AND verificado = FALSE RETURNING nome_completo, email_encrypted',
      [id]
    );

    if ((resultado.rowCount ?? 0) === 0) {
      await client.query('ROLLBACK');
      return res
        .status(404)
        .json({ error: 'Usuário não encontrado ou já aprovado.' });
    }

    await client.query('COMMIT');
    inTransaction = false;

    const usuario = resultado.rows[0];
    await sendRejectionEmail(getEmail(usuario), usuario.nome_completo, motivo);

    res.json({
      success: true,
      message: `Cadastro de ${usuario.nome_completo} rejeitado e removido. E-mail de notificação enviado.`,
    });
  } catch (err) {
    if (inTransaction) {
      await client.query('ROLLBACK');
    }
    console.error('Erro ao rejeitar usuário:', err);
    res.status(500).json({ error: 'Erro ao rejeitar usuário.' });
  } finally {
    client.release();
  }
});

// POST /admin/desativar/:id - Desativa um usuário aprovado
router.post('/desativar/:id', async (req: Request, res: Response) => {
  const id = parseIdParam(req.params.id);

  if (!id) {
    return res.status(400).json({ error: 'ID inválido.' });
  }

  try {
    const resultado = await pool.query(
      'UPDATE usuarios_adv SET ativo = FALSE WHERE id = $1 AND verificado = TRUE RETURNING nome_completo, email_encrypted',
      [id]
    );

    const usuario = resultado.rows[0];
    (resultado.rowCount ?? 0) > 0
      ? (await sendDeactivationEmail(getEmail(usuario), usuario.nome_completo),
        res.json({
          success: true,
          message: `Usuário ${usuario.nome_completo} desativado com sucesso! E-mail de notificação enviado.`,
        }))
      : res
          .status(404)
          .json({ error: 'Usuário não encontrado ou não está aprovado.' });
  } catch (err) {
    console.error('Erro ao desativar usuário:', err);
    res.status(500).json({ error: 'Erro ao desativar usuário.' });
  }
});

// POST /admin/reativar/:id - Reativa um usuário desativado
router.post('/reativar/:id', async (req: Request, res: Response) => {
  const id = parseIdParam(req.params.id);

  if (!id) {
    return res.status(400).json({ error: 'ID inválido.' });
  }

  try {
    const resultado = await pool.query(
      'UPDATE usuarios_adv SET ativo = TRUE WHERE id = $1 AND verificado = TRUE RETURNING nome_completo, email_encrypted',
      [id]
    );

    const usuario = resultado.rows[0];
    (resultado.rowCount ?? 0) > 0
      ? (await sendReactivationEmail(getEmail(usuario), usuario.nome_completo),
        res.json({
          success: true,
          message: `Usuário ${usuario.nome_completo} reativado com sucesso! E-mail de notificação enviado.`,
        }))
      : res.status(404).json({ error: 'Usuário não encontrado.' });
  } catch (err) {
    console.error('Erro ao reativar usuário:', err);
    res.status(500).json({ error: 'Erro ao reativar usuário.' });
  }
});

// DELETE /admin/excluir/:id - Exclui permanentemente um usuário
router.delete('/excluir/:id', async (req: Request, res: Response) => {
  const id = parseIdParam(req.params.id);

  if (!id) {
    return res.status(400).json({ error: 'ID inválido.' });
  }

  try {
    const resultado = await pool.query(
      'DELETE FROM usuarios_adv WHERE id = $1 RETURNING nome_completo',
      [id]
    );

    (resultado.rowCount ?? 0) > 0
      ? res.json({
          success: true,
          message: `Usuário ${resultado.rows[0].nome_completo} excluído permanentemente.`,
        })
      : res.status(404).json({ error: 'Usuário não encontrado.' });
  } catch (err) {
    console.error('Erro ao excluir usuário:', err);
    res.status(500).json({ error: 'Erro ao excluir usuário.' });
  }
});

export default router;
