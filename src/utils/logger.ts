/**
 * Logger estruturado para o auth-service.
 *
 * - Desenvolvimento: saída legível com cores e timestamp ISO.
 * - Produção:        JSON de uma linha por evento (compatível com
 *                    coletores de log como Loki, Datadog, CloudWatch).
 *
 * Não adiciona dependências externas; usa process.stdout/stderr
 * diretamente para garantir buffering mínimo em containers Docker.
 */

const IS_PROD = process.env.NODE_ENV === 'production';
const SERVICE = 'auth-service';

type Level = 'debug' | 'info' | 'warn' | 'error';

/** Códigos ANSI — usados apenas em modo dev. */
const COLOR: Record<Level, string> = {
  debug: '\x1b[36m', // ciano
  info:  '\x1b[32m', // verde
  warn:  '\x1b[33m', // amarelo
  error: '\x1b[31m', // vermelho
};
const RESET = '\x1b[0m';

function emit(level: Level, message: string, meta?: Record<string, unknown>): void {
  const ts = new Date().toISOString();

  if (IS_PROD) {
    // JSON estruturado — uma linha por evento
    const entry = JSON.stringify({
      ts,
      level,
      service: SERVICE,
      message,
      ...(meta ?? {}),
    });
    const stream = level === 'error' || level === 'warn' ? process.stderr : process.stdout;
    stream.write(entry + '\n');
  } else {
    // Formato legível com cor
    const color = COLOR[level];
    const pad = level.toUpperCase().padEnd(5);
    const metaStr = meta && Object.keys(meta).length > 0 ? ' ' + JSON.stringify(meta) : '';
    const line = `${color}[${ts}] ${pad} [${SERVICE}]${RESET} ${message}${metaStr}`;
    if (level === 'error' || level === 'warn') {
      process.stderr.write(line + '\n');
    } else {
      process.stdout.write(line + '\n');
    }
  }
}

const logger = {
  /** Diagnósticos internos — omitidos em produção quando LOG_LEVEL != debug. */
  debug: (message: string, meta?: Record<string, unknown>) => {
    if (process.env.LOG_LEVEL === 'debug' || !IS_PROD) {
      emit('debug', message, meta);
    }
  },
  info:  (message: string, meta?: Record<string, unknown>) => emit('info',  message, meta),
  warn:  (message: string, meta?: Record<string, unknown>) => emit('warn',  message, meta),
  error: (message: string, meta?: Record<string, unknown>) => emit('error', message, meta),
};

export default logger;
