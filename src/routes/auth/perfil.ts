/**
 * Rotas de Perfil do Usuário Autenticado
 */
import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import pool from '../../config/database';
import { SALT_ROUNDS } from '../../config/constants';
import { upload } from '../../middlewares/upload';
import { sanitizeText, validatePassword, decryptEmail } from '../../utils/sanitizers';

const router = Router();

const hasUsuariosColumn = async (columnName: string): Promise<boolean> => {
  const check = await pool.query(
    `SELECT 1
     FROM information_schema.columns
     WHERE table_name = 'usuarios_adv' AND column_name = $1
     LIMIT 1`,
    [columnName]
  );
  return check.rows.length > 0;
};

// GET /perfil - Retorna dados do perfil do usuário logado
router.get('/perfil', async (req: Request, res: Response) => {
  const usuarioId = (req.session as any)?.usuarioId;
  if (!usuarioId) {
    return res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' });
  }

  try {
    const hasTelefone = await hasUsuariosColumn('telefone');
    const hasFotoPerfil = await hasUsuariosColumn('foto_perfil');

    const resultado = await pool.query(
      `SELECT nome_completo, email_encrypted, numero_oab, estado_oab,
              ${hasTelefone ? 'telefone' : "NULL::varchar AS telefone"},
              ${hasFotoPerfil ? '(foto_perfil IS NOT NULL)' : 'FALSE'} AS tem_foto
       FROM usuarios_adv WHERE id = $1 LIMIT 1`,
      [usuarioId]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const u = resultado.rows[0];
    let email = '';
    if (u.email_encrypted) {
      try {
        email = decryptEmail(u.email_encrypted);
      } catch {
        email = '';
      }
    }

    return res.json({
      nome_completo: u.nome_completo || '',
      email,
      numero_oab: u.numero_oab || '',
      estado_oab: u.estado_oab || '',
      telefone: u.telefone || '',
      foto_url: u.tem_foto ? `/api/auth/foto-perfil/${usuarioId}` : null,
    });
  } catch (err) {
    logger.error('Erro ao buscar perfil:', { error: (err as Error).message });
    return res.status(500).json({ error: 'Erro ao buscar perfil.' });
  }
});

// GET /foto-perfil/:id - Serve a imagem do perfil
router.get('/foto-perfil/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const hasFotoPerfil = await hasUsuariosColumn('foto_perfil');
    const hasFotoPerfilTipo = await hasUsuariosColumn('foto_perfil_tipo');
    if (!hasFotoPerfil || !hasFotoPerfilTipo) {
      return res
        .status(503)
        .json({ error: 'Recurso indisponível: colunas de foto ainda não existem no banco.' });
    }

    const resultado = await pool.query(
      'SELECT foto_perfil, foto_perfil_tipo FROM usuarios_adv WHERE id = $1',
      [id]
    );

    if (resultado.rows.length === 0 || !resultado.rows[0].foto_perfil) {
      return res.status(404).send('Imagem não encontrada.');
    }

    const { foto_perfil, foto_perfil_tipo } = resultado.rows[0];
    res.set('Content-Type', foto_perfil_tipo || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=86400');
    return res.send(foto_perfil);
  } catch (err) {
    logger.error('Erro ao buscar foto de perfil:', { error: (err as Error).message });
    return res.status(500).send('Erro ao buscar imagem.');
  }
});

// POST /perfil/foto - Atualiza a foto de perfil do usuário logado
router.post('/perfil/foto', upload.single('foto'), async (req: Request, res: Response) => {
  const usuarioId = (req.session as any)?.usuarioId;
  if (!usuarioId) {
    return res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' });
  }

  const file = (req as any).file;
  if (!file) {
    return res.status(400).json({ error: 'Nenhuma imagem enviada.' });
  }

  if (file.size > 5 * 1024 * 1024) {
    return res.status(400).json({ error: 'Imagem muito grande. Máximo 5 MB.' });
  }

  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedMimes.includes(file.mimetype)) {
    return res.status(400).json({ error: 'Formato inválido. Use JPEG, PNG ou WebP.' });
  }

  try {
    const hasFotoPerfil = await hasUsuariosColumn('foto_perfil');
    const hasFotoPerfilTipo = await hasUsuariosColumn('foto_perfil_tipo');
    if (!hasFotoPerfil || !hasFotoPerfilTipo) {
      return res
        .status(503)
        .json({ error: 'Recurso indisponível: colunas de foto ainda não existem no banco.' });
    }

    await pool.query(
      `UPDATE usuarios_adv
       SET foto_perfil = $1, foto_perfil_tipo = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [file.buffer, file.mimetype, usuarioId]
    );

    return res.json({
      success: true,
      foto_url: `/api/auth/foto-perfil/${usuarioId}`,
    });
  } catch (err) {
    logger.error('Erro ao salvar foto de perfil:', { error: (err as Error).message });
    return res.status(500).json({ error: 'Erro ao salvar foto.' });
  }
});

// POST /alterar-senha - Altera a senha do usuário logado (requer senha atual)
router.post('/alterar-senha', async (req: Request, res: Response) => {
  const usuarioId = (req.session as any)?.usuarioId;
  if (!usuarioId) {
    return res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' });
  }

  const senhaAtual = sanitizeText(req.body.senhaAtual);
  const novaSenha = sanitizeText(req.body.novaSenha);

  if (!senhaAtual || !novaSenha) {
    return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias.' });
  }

  const senhaValidation = validatePassword(novaSenha);
  if (!senhaValidation.valid) {
    return res.status(400).json({ error: senhaValidation.message });
  }

  try {
    const resultado = await pool.query(
      'SELECT senha FROM usuarios_adv WHERE id = $1 LIMIT 1',
      [usuarioId]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const senhaAtualValida = await bcrypt.compare(senhaAtual, resultado.rows[0].senha);
    if (!senhaAtualValida) {
      return res.status(401).json({ error: 'Senha atual incorreta.' });
    }

    const novoHash = await bcrypt.hash(novaSenha, SALT_ROUNDS);
    await pool.query(
      'UPDATE usuarios_adv SET senha = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [novoHash, usuarioId]
    );

    return res.json({ success: true, message: 'Senha alterada com sucesso.' });
  } catch (err) {
    logger.error('Erro ao alterar senha:', { error: (err as Error).message });
    return res.status(500).json({ error: 'Erro ao alterar senha.' });
  }
});

// PATCH /perfil - Atualiza dados editáveis do perfil
router.patch('/perfil', async (req: Request, res: Response) => {
  const usuarioId = (req.session as any)?.usuarioId;
  if (!usuarioId) {
    return res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' });
  }

  const nomeCompleto = sanitizeText(req.body.nome_completo ?? '');
  const numeroOab = sanitizeText(req.body.numero_oab ?? '');
  const estadoOab = sanitizeText(req.body.estado_oab ?? '');
  const telefone = sanitizeText(req.body.telefone ?? '');

  if (!nomeCompleto) {
    return res.status(400).json({ error: 'Nome completo é obrigatório.' });
  }

  try {
    const hasTelefone = await hasUsuariosColumn('telefone');

    const query = hasTelefone
      ? `UPDATE usuarios_adv
         SET nome_completo = $1, numero_oab = $2, estado_oab = $3,
             telefone = $4, updated_at = CURRENT_TIMESTAMP
         WHERE id = $5`
      : `UPDATE usuarios_adv
         SET nome_completo = $1, numero_oab = $2, estado_oab = $3,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`;

    const params = hasTelefone
      ? [nomeCompleto, numeroOab || null, estadoOab || null, telefone || null, usuarioId]
      : [nomeCompleto, numeroOab || null, estadoOab || null, usuarioId];

    await pool.query(query, params);

    return res.json({ success: true });
  } catch (err) {
    logger.error('Erro ao atualizar perfil:', { error: (err as Error).message });
    return res.status(500).json({ error: 'Erro ao atualizar perfil.' });
  }
});

export default router;

