/**
 * Middlewares de autenticação/autorização
 */
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

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
    const userId = getUserId(req);
    if (!userId) {
      logger.warn('requireAdmin: acesso negado — não autenticado', { ip: req.ip });
      return res.status(401).json({ error: 'Não autenticado.' });
    }

    const isAdmin = isAdminRequest(req);
    if (!isAdmin) {
      logger.warn('requireAdmin: acesso negado — não é admin', { userId, ip: req.ip });
      return res.status(403).json({ error: 'Acesso negado.' });
    }

  return next();
};
