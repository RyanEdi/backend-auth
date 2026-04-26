import { Router, Request, Response } from 'express';
import { consultaCep } from '../services/cepService';

const router = Router();

// GET /consulta-cep/:cep
router.get('/:cep', async (req: Request, res: Response) => {
  const { cep } = req.params;
  const cpfUsuario = req.header('x-cpf-usuario');
  const accessToken = req.header('authorization')?.replace('Bearer ', '');

  if (!cpfUsuario || !accessToken) {
    return res.status(400).json({ error: 'x-cpf-usuario e Authorization são obrigatórios' });
  }

  try {
    const result = await consultaCep(cep);    res.json(result);
  } catch (error: any) {
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    res.status(500).json({ error: 'Erro ao consultar CEP' });
  }
});

export default router;
