/**
 * Middlewares de autenticação/autorização
 */
import { Request, Response, NextFunction } from 'express';

const getUserId = (req: Request): number | null => {
  const sessionUserId = req.session?.usuarioId;
  if (sessionUserId !== undefined && Number.isFinite(Number(sessionUserId))) {
    return Number(sessionUserId);
  }

  const headerUserId = req.header('x-user-id');
  if (!headerUserId || !Number.isFinite(Number(headerUserId))) {
    return null;
  }

  return Number(headerUserId);
};

const isAdminRequest = (req: Request): boolean => {
  if (req.session?.isAdmin !== undefined) {
    return Boolean(req.session.isAdmin);
  }

  return String(req.header('x-user-admin') || '').toLowerCase() === 'true';
};

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!getUserId(req)) {
    return res.status(401).json({ error: 'Não autenticado.' });
  }

  return next();
};


export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
    console.log('[requireAdmin] Checando admin');
    const userId = getUserId(req);
    if (!userId) {
      console.log('[requireAdmin] Falha: Não autenticado');
      return res.status(401).json({ error: 'Não autenticado.' });
    }

    const isAdmin = isAdminRequest(req);
    if (!isAdmin) {
      console.log('[requireAdmin] Falha: Acesso negado para userId', userId);
      return res.status(403).json({ error: 'Acesso negado.' });
    }

    console.log('[requireAdmin] Usuário autenticado e admin:', userId);
  return next();
};
