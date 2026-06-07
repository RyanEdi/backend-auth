
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
  // Desabilitar audit logs se variável estiver setada
  if (process.env.DISABLE_AUDIT_LOGS === '1') {
    return;
  }

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
    const err: any = error;
    logger.error('Erro ao salvar log de auditoria', {
      errorMessage: err?.message ?? String(err),
      errorCode: err?.code,
      stack: err?.stack,
      raw: typeof err === 'object' ? JSON.stringify(err, Object.getOwnPropertyNames(err)) : String(err),
    });
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

// Log de verificação de variáveis após carregamento
logger.info('Variáveis de ambiente carregadas', {
  has_SESSION_SECRET: !!process.env.SESSION_SECRET,
  has_CPF_SECRET: !!process.env.CPF_SECRET,
  has_EMAIL_SECRET: !!process.env.EMAIL_SECRET,
  DB_HOST: process.env.DB_HOST,
  NODE_ENV: process.env.NODE_ENV,
});

// Rota de teste para garantir que o Express esta funcionando

// Rota GET / para resposta padrão
app.get('/', (req, res) => {
  res.json({ message: 'Auth service online' });
});

// Debug endpoint (remover em produção)
app.get('/debug/env', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Not available in production' });
  }
  res.json({
    SESSION_SECRET: !!process.env.SESSION_SECRET ? '***' : 'MISSING',
    CPF_SECRET: !!process.env.CPF_SECRET ? `${process.env.CPF_SECRET.length} chars` : 'MISSING',
    EMAIL_SECRET: !!process.env.EMAIL_SECRET ? `${process.env.EMAIL_SECRET.length} chars` : 'MISSING',
    DB_HOST: process.env.DB_HOST || 'MISSING',
    DB_PORT: process.env.DB_PORT || 'MISSING',
    DB_USER: process.env.DB_USER || 'MISSING',
    DB_NAME: process.env.DB_NAME || 'MISSING',
    NODE_ENV: process.env.NODE_ENV || 'development',
  });
});

app.use('/', authRouter);
app.use('/admin', adminRouter);
app.use('/api/clients', clientsRouter);
app.use('/consulta-cep', consultaCepRouter);


app.get('/health', (_req, res) => {
  res.json({ service: 'auth-service', status: 'ok' });
});

app.use((err: any, _req: any, res: any, _next: any) => {
  try {
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

    // Log detalhado para ajudar debug: rota, método, headers (limitado), body (pequeno), stack
    try {
      const req = _req as any;
      const headers = req?.headers ? { origin: req.headers.origin, host: req.headers.host } : undefined;
      const bodyPreview = req?.body ? JSON.stringify(req.body).slice(0, 200) : undefined;
      logger.error('Erro nao tratado', {
        error: message,
        path: req?.originalUrl,
        method: req?.method,
        headers,
        bodyPreview,
        stack: (err as Error)?.stack,
      });
    } catch (logErr) {
      logger.error('Falha ao montar log detalhado de erro', { error: (logErr as Error).message });
    }

    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === 'production'
          ? 'Erro interno do servidor.'
          : `Erro interno do servidor: ${message}`,
    });
  } catch (outerErr) {
    // Se o próprio handler falhar, garantimos retorno 500 simples e logamos
    logger.error('Erro no error-handler', { error: (outerErr as Error).message });
    return res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
  }
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
