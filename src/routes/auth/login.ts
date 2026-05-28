/**
 * Rotas de Login e Sessão
 */
import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import pool from '../../config/database';
import { ADMIN_CPFS } from '../../config/constants';
import { onlyDigits, sanitizeText, hashCpf, decryptEmail } from '../../utils/sanitizers';

const router = Router();

// Extensão da sessão para incluir usuarioId
declare module 'express-session' {
  interface SessionData {
    usuarioId?: number;
    isAdmin?: boolean;
  }
}

// GET /login - Exibe página de login (compatível com frontend React)
router.get('/login', (req: Request, res: Response) => {
  return res.status(200).json({ ok: true, ...req.query });
});

// POST /login - Login do usuário (CPF ou número OAB)
router.post('/login', async (req: Request, res: Response) => {
  const identificador = onlyDigits(req.body.identificador || req.body.cpf);
  const senha = sanitizeText(req.body.senha);
  const lembrar = req.body.lembrar;

  if (!identificador || !senha) {
    return res.status(400).json({ success: false, message: 'CPF/OAB e senha são obrigatórios.' });
  }

  try {
    // Busca por CPF (hashado ou plaintext legado) ou número OAB (plain)
    const cpfHash = hashCpf(identificador);
    const resultado = await pool.query(
      'SELECT * FROM usuarios_adv WHERE cpf = $1 OR cpf = $2 OR numero_oab = $3',
      [cpfHash, identificador, identificador]
    );

    if (resultado.rows.length > 0) {
      const usuario = resultado.rows[0];

      // Admins não precisam de verificação (compara hash dos CPFs admin)
      const isAdmin = ADMIN_CPFS.some(adminCpf => hashCpf(adminCpf) === usuario.cpf);

      // Verifica se o email foi verificado (exceto para admins)
      if (!isAdmin && !usuario.email_verified) {
        return res.status(403).json({ success: false, action: 'verify-email', userId: usuario.id });
      }

      // Verifica se a conta foi aprovada pelo admin (exceto para admins)
      if (!isAdmin && !usuario.verificado) {
        return res.status(403).json({ success: false, message: 'Sua conta está pendente de aprovação por um administrador.' });
      }

      // Verifica se a conta está ativa (exceto para admins)
      if (!isAdmin && usuario.ativo === false) {
        return res.status(403).json({ success: false, message: 'Sua conta foi desativada.' });
      }

      // Verificar senha com bcrypt
      const senhaValida = await bcrypt.compare(senha, usuario.senha);

      if (senhaValida) {
        req.session.usuarioId = usuario.id;
        req.session.isAdmin = isAdmin;

        if (lembrar) {
          req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 dias
        }

        // Retorna sucesso e a rota apropriada
        const redirectTo = isAdmin ? '/admin' : '/dashboard';
        return res.status(200).json({ success: true, redirectTo, isAdmin });
      } else {
        return res.status(401).json({ success: false, message: 'Senha incorreta.' });
      }
    } else {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
    }
  } catch (err) {
    console.error('Erro no login:', err);
    return res.status(500).json({ success: false, message: 'Erro interno no servidor.' });
  }
});

// GET /logout - Logout do usuário
router.get('/logout', (req: Request, res: Response) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Erro ao destruir sessão:', err);
    }
    res.redirect('/loginpage');
  });
});

// GET /status - Verifica se o usuário está logado
router.get('/status', (req: Request, res: Response) => {
  if (req.session.usuarioId) {
    pool
      .query('SELECT nome_completo, email_encrypted FROM usuarios_adv WHERE id = $1 LIMIT 1', [
        req.session.usuarioId,
      ])
      .then(resultado => {
        const row = resultado.rows[0];
        let email = '';
        try { email = row?.email_encrypted ? decryptEmail(row.email_encrypted) : ''; } catch { email = ''; }
        res.json({
          logged: true,
          usuarioId: req.session.usuarioId,
          isAdmin: Boolean(req.session.isAdmin),
          nomeCompleto: row?.nome_completo || '',
          email,
        });
      })
      .catch(err => {
        console.error('Erro ao buscar dados da sessao:', err);
        res.json({
          logged: true,
          usuarioId: req.session.usuarioId,
          isAdmin: Boolean(req.session.isAdmin),
          nomeCompleto: '',
          email: '',
        });
      });
  } else {
    res.json({ logged: false });
  }
});

export default router;
