/**
 * Rotas de Administração - Agregador
 */
import { Router } from 'express';
import { requireAdmin } from '../../middlewares/auth';
import usersRoutes from './users';
import clientsRoutes from './clients';

const router = Router();

// Monta todas as rotas de administração
router.use(requireAdmin);
router.use(usersRoutes);
router.use(clientsRoutes);

export default router;
