/**
 * Rotas de Autenticação - Agregador
 */
import { Router } from 'express';
import loginRoutes from './login';
import registerRoutes from './register';
import passwordRoutes from './password';
import userRoutes from './user';
import perfilRoutes from './perfil';
import paymentRoutes from './payment';

const router = Router();

// Monta todas as rotas de autenticação
router.use(loginRoutes);
router.use(registerRoutes);
router.use(passwordRoutes);
router.use(userRoutes);
router.use(perfilRoutes);
router.use(paymentRoutes);

export default router;
