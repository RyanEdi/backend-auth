/**
 * Rotas de recursos do Usuário
 */
import { Router, Request, Response } from 'express';
import pool from '../../config/database';
import logger from '../../utils/logger';

const router = Router();

// GET /foto-oab/:id - Retorna a imagem da carteira OAB salva no banco
router.get('/foto-oab/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const resultado = await pool.query(
      'SELECT foto_oab, foto_oab_tipo FROM usuarios_adv WHERE id = $1',
      [id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).send('Imagem não encontrada.');
    }

    const { foto_oab, foto_oab_tipo } = resultado.rows[0];

    if (!foto_oab) {
      return res.status(404).send('Usuário não possui foto cadastrada.');
    }

    // Seta o content-type e retorna os bytes da imagem
    res.set('Content-Type', foto_oab_tipo || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=86400'); // Cache de 1 dia
    res.send(foto_oab);
  } catch (err) {
    logger.error('Erro ao buscar foto OAB', { error: (err as Error).message });
    res.status(500).send('Erro ao buscar imagem.');
  }
});

export default router;
