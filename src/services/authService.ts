
import dotenv from 'dotenv';
import path from 'path';
import { MulterError } from 'multer';
import authRouter from '../routes/auth';
import adminRouter from '../routes/admin';
import clientsRouter from '../routes/admin/clients';
import consultaCepRouter from '../routes/consultaCep';
import { createBaseApp } from '../shared/createBaseApp';
import { resolvePort } from '../config/http';
import pool, { runMigrations } from '../config/database';
import logger from '../utils/logger';

const auditLogger = async (entry: {
  serviceName: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  userId?: number | null;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}) => {
  try {
    await pool.query(
      `INSERT INTO system_audit_logs (
        service_name, method, path, status_code, duration_ms, user_id, ip_address, user_agent, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)`,
      [
        entry.serviceName,
        entry.method,
        entry.path,
        entry.statusCode,
        entry.durationMs,
        entry.userId ?? null,
        entry.ipAddress ?? null,
        entry.userAgent ?? null,
        JSON.stringify(entry.metadata ?? {}),
      ]
    );
  } catch (error) {
    logger.error('Erro ao salvar log de auditoria', { error: (error as Error).message });
  }
};

const app = createBaseApp({
  withSession: true,
  serviceName: 'auth-service',
  auditLogger,
});

const requiredEnvVars = ['SESSION_SECRET', 'CPF_SECRET', 'EMAIL_SECRET'];
const missingEnvVars = requiredEnvVars.filter(name => !process.env[name]);
if (missingEnvVars.length > 0) {
  logger.error('Variáveis de ambiente obrigatórias ausentes', {
    missing: missingEnvVars,
  });
}

// Rota de teste para garantir que o Express esta funcionando

// Rota GET / para resposta padrão
app.get('/', (req, res) => {
  res.json({ message: 'Auth service online' });
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

  if (err instanceof MulterError) {
    return res.status(400).json({ success: false, message: err.message });
  }

  if (err?.message === 'Apenas imagens são permitidas') {
    return res.status(400).json({ success: false, message: err.message });
  }

  const message = (err as Error)?.message || 'Erro interno do servidor.';
  logger.error('Erro nao tratado', { error: message });
  return res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === 'production'
        ? 'Erro interno do servidor.'
        : `Erro interno do servidor: ${message}`,
  });
});

const PORT = resolvePort('AUTH_SERVICE_PORT', 3334);

if (require.main === module) {
  runMigrations().then(() => {
    app.listen(PORT, () => {
      logger.info(`Auth service running on port ${PORT}`);
    });
  });
}

export default app;
