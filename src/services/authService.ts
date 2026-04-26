
import dotenv from 'dotenv';
import path from 'path';
import authRouter from '../routes/auth';
import adminRouter from '../routes/admin';
import clientsRouter from '../routes/admin/clients';
import consultaCepRouter from '../routes/consultaCep';
import { createBaseApp } from '../shared/createBaseApp';
import { resolvePort } from '../config/http';
import { runMigrations } from '../config/database';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = createBaseApp({ withSession: true });

// Log global para todos os requests
app.use((req, res, next) => {
  console.log('[AUTH-SERVICE] Recebido:', req.method, req.url);
  next();
});

// Log global para todos os requests
app.use((req, res, next) => {
  console.log('[AUTH-SERVICE] Recebido:', req.method, req.url);
  next();
});



// Endpoint de teste para garantir que o Express está funcionando
app.post('/test', (req, res) => {
  console.log('POST /test recebido');
  res.json({ ok: true });
});

app.use('/', authRouter);
app.use('/admin', adminRouter);
app.use('/api/clients', clientsRouter);
app.use('/consulta-cep', consultaCepRouter);


app.get('/health', (_req, res) => {
  res.json({ service: 'auth-service', status: 'ok' });
});

app.use((err: any, _req: any, res: any, _next: any) => {
  if (err?.type === 'request.aborted' || err?.name === 'BadRequestError') {
    return res.status(400).json({ success: false, message: 'Requisicao abortada pelo cliente.' });
  }

  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'JSON invalido na requisicao.' });
  }

  console.error('Erro nao tratado:', err);
  return res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
});

const PORT = resolvePort('AUTH_SERVICE_PORT', 3334);

if (require.main === module) {
  runMigrations().then(() => {
    app.listen(PORT, () => {
      console.log(`Auth service running on port ${PORT}`);
    });
  });
}

export default app;
