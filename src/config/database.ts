import dotenv from 'dotenv';
import path from 'path';
import { Pool } from 'pg';

// Carrega .env da pasta raiz do projeto
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import logger from '../utils/logger';

// Configuração do Banco de Dados PostgreSQL via .env
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Teste de conexão
pool.on('connect', () => {
  logger.info('Conectado ao PostgreSQL');
});

pool.on('error', err => {
  logger.error('Erro na conexão com PostgreSQL', { error: (err as Error).message });
});

// Função para executar migrações automáticas
export async function runMigrations(): Promise<void> {
  try {
    logger.info('Executando migrações do banco de dados');

    // Migração 0: garantir tabela base antes de executar ALTER TABLE usuarios_adv.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios_adv (
        id SERIAL PRIMARY KEY,
        nome_completo VARCHAR(200) NOT NULL,
        email_encrypted TEXT,
        email_hash VARCHAR(255),
        senha VARCHAR(255) NOT NULL,
        data_nascimento TEXT,
        cpf VARCHAR(255) NOT NULL,
        numero_oab VARCHAR(50),
        estado_oab VARCHAR(10),
        foto_oab BYTEA,
        foto_oab_tipo VARCHAR(50),
        verificado BOOLEAN NOT NULL DEFAULT FALSE,
        ativo BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_adv_cpf_unique
        ON usuarios_adv(cpf);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_adv_email_hash_unique
        ON usuarios_adv(email_hash)
        WHERE email_hash IS NOT NULL;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_adv_numero_oab_unique
        ON usuarios_adv(numero_oab)
        WHERE numero_oab IS NOT NULL;
    `);

    // Migração 1: Adicionar coluna 'ativo' se não existir
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'usuarios_adv' AND column_name = 'ativo'
        ) THEN
          ALTER TABLE usuarios_adv ADD COLUMN ativo BOOLEAN DEFAULT TRUE;
          RAISE NOTICE 'Coluna ativo adicionada com sucesso';
        END IF;
      END $$;
    `);

    // Migração 2: CPF hash e Email criptografado em usuarios_adv
    await pool.query(`
      DO $$
      BEGIN
        -- Aumentar cpf para caber o hash
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'usuarios_adv' AND column_name = 'cpf'
          AND character_maximum_length IS NOT NULL AND character_maximum_length < 255
        ) THEN
          ALTER TABLE usuarios_adv ALTER COLUMN cpf TYPE VARCHAR(255);
        END IF;
      EXCEPTION WHEN insufficient_privilege THEN
        RAISE NOTICE 'Sem permissão para ALTER cpf — execute manualmente: ALTER TABLE usuarios_adv ALTER COLUMN cpf TYPE VARCHAR(255);';
      END $$;
    `);
    await pool.query(`
      ALTER TABLE usuarios_adv ADD COLUMN IF NOT EXISTS email_encrypted TEXT;
      ALTER TABLE usuarios_adv ADD COLUMN IF NOT EXISTS email_hash VARCHAR(255);
    `);

    // Migração 3: Criar tabela de clientes vinculada ao advogado
    await pool.query(`
      CREATE TABLE IF NOT EXISTS clientes_adv (
        id VARCHAR(36) PRIMARY KEY,
        advogado_id INTEGER NOT NULL,
        nome_completo VARCHAR(200) NOT NULL,
        cpf VARCHAR(20) NOT NULL,
        cpf_hash VARCHAR(255) NOT NULL,
        dados_sensiveis_hash JSONB DEFAULT '{}'::jsonb,
        email VARCHAR(150),
        email_hash VARCHAR(255),
        telefone VARCHAR(25),
        telefone_hash VARCHAR(255),
        cep VARCHAR(12),
        endereco_completo TEXT,
        estado_civil VARCHAR(50),
        profissao VARCHAR(100),
        rg VARCHAR(30),
        rg_hash VARCHAR(255),
        cidade_uf VARCHAR(100),
        contribuicao_mensal VARCHAR(50),
        valor_dano_moral VARCHAR(50),
        valor_da_causa VARCHAR(50),
        possui_deficiencia BOOLEAN DEFAULT FALSE,
        tipo_deficiencia VARCHAR(30),
        data_laudo DATE,
        cid VARCHAR(20),
        grau_deficiencia_ifbra VARCHAR(20),
        documento_comprobatorio_nome VARCHAR(255),
        observacoes_juridicas TEXT,
        endereco_escritorio TEXT,
        endereco_df_iprev TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      ALTER TABLE clientes_adv ADD COLUMN IF NOT EXISTS advogado_id INTEGER;
      ALTER TABLE clientes_adv ADD COLUMN IF NOT EXISTS nome_completo VARCHAR(200);
      ALTER TABLE clientes_adv ADD COLUMN IF NOT EXISTS cpf VARCHAR(20);
      ALTER TABLE clientes_adv ADD COLUMN IF NOT EXISTS cpf_hash VARCHAR(255);
      ALTER TABLE clientes_adv ADD COLUMN IF NOT EXISTS dados_sensiveis_hash JSONB DEFAULT '{}'::jsonb;
      ALTER TABLE clientes_adv ADD COLUMN IF NOT EXISTS email VARCHAR(150);
      ALTER TABLE clientes_adv ADD COLUMN IF NOT EXISTS email_hash VARCHAR(255);
      ALTER TABLE clientes_adv ADD COLUMN IF NOT EXISTS telefone VARCHAR(25);
      ALTER TABLE clientes_adv ADD COLUMN IF NOT EXISTS telefone_hash VARCHAR(255);
      ALTER TABLE clientes_adv ADD COLUMN IF NOT EXISTS cep VARCHAR(12);
      ALTER TABLE clientes_adv ADD COLUMN IF NOT EXISTS endereco_completo TEXT;
      ALTER TABLE clientes_adv ADD COLUMN IF NOT EXISTS estado_civil VARCHAR(50);
      ALTER TABLE clientes_adv ADD COLUMN IF NOT EXISTS profissao VARCHAR(100);
      ALTER TABLE clientes_adv ADD COLUMN IF NOT EXISTS rg VARCHAR(30);
      ALTER TABLE clientes_adv ADD COLUMN IF NOT EXISTS rg_hash VARCHAR(255);
      ALTER TABLE clientes_adv ADD COLUMN IF NOT EXISTS cidade_uf VARCHAR(100);
      ALTER TABLE clientes_adv ADD COLUMN IF NOT EXISTS contribuicao_mensal VARCHAR(50);
      ALTER TABLE clientes_adv ADD COLUMN IF NOT EXISTS valor_dano_moral VARCHAR(50);
      ALTER TABLE clientes_adv ADD COLUMN IF NOT EXISTS valor_da_causa VARCHAR(50);
      ALTER TABLE clientes_adv ADD COLUMN IF NOT EXISTS possui_deficiencia BOOLEAN DEFAULT FALSE;
      ALTER TABLE clientes_adv ADD COLUMN IF NOT EXISTS tipo_deficiencia VARCHAR(30);
      ALTER TABLE clientes_adv ADD COLUMN IF NOT EXISTS data_laudo DATE;
      ALTER TABLE clientes_adv ADD COLUMN IF NOT EXISTS cid VARCHAR(20);
      ALTER TABLE clientes_adv ADD COLUMN IF NOT EXISTS grau_deficiencia_ifbra VARCHAR(20);
      ALTER TABLE clientes_adv ADD COLUMN IF NOT EXISTS documento_comprobatorio_nome VARCHAR(255);
      ALTER TABLE clientes_adv ADD COLUMN IF NOT EXISTS observacoes_juridicas TEXT;
      ALTER TABLE clientes_adv ADD COLUMN IF NOT EXISTS endereco_escritorio TEXT;
      ALTER TABLE clientes_adv ADD COLUMN IF NOT EXISTS endereco_df_iprev TEXT;
      ALTER TABLE clientes_adv ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      ALTER TABLE clientes_adv ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS clientes_adv_periodos (
        id SERIAL PRIMARY KEY,
        cliente_id VARCHAR(36) NOT NULL,
        tipo VARCHAR(30) NOT NULL,
        data_inicio DATE,
        data_fim DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'fk_clientes_adv_periodos_cliente'
        ) THEN
          ALTER TABLE clientes_adv_periodos
            ADD CONSTRAINT fk_clientes_adv_periodos_cliente
            FOREIGN KEY (cliente_id)
            REFERENCES clientes_adv(id)
            ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'fk_clientes_adv_advogado'
        ) THEN
          ALTER TABLE clientes_adv
            ADD CONSTRAINT fk_clientes_adv_advogado
            FOREIGN KEY (advogado_id)
            REFERENCES usuarios_adv(id)
            ON DELETE RESTRICT;
        END IF;
      END $$;
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_clientes_adv_advogado_id ON clientes_adv(advogado_id);
      CREATE INDEX IF NOT EXISTS idx_clientes_adv_created_at ON clientes_adv(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_clientes_adv_periodos_cliente_id ON clientes_adv_periodos(cliente_id);
    `);

    // Migração 5: Verificação de email por código
    await pool.query(`
      ALTER TABLE usuarios_adv ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
      ALTER TABLE usuarios_adv ADD COLUMN IF NOT EXISTS email_verification_code VARCHAR(72);
      ALTER TABLE usuarios_adv ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMP;
    `);

    // Migração 7: Ampliar coluna para hash bcrypt do código de verificação
    await pool.query(`
      ALTER TABLE usuarios_adv
        ALTER COLUMN email_verification_code TYPE VARCHAR(72);
    `);

    // Migração 6: Campos de perfil do usuário
    await pool.query(`
      ALTER TABLE usuarios_adv ADD COLUMN IF NOT EXISTS telefone VARCHAR(25);
      ALTER TABLE usuarios_adv ADD COLUMN IF NOT EXISTS foto_perfil BYTEA;
      ALTER TABLE usuarios_adv ADD COLUMN IF NOT EXISTS foto_perfil_tipo VARCHAR(50);
    `);

    // Migração 8: Status de pagamento para liberar login apenas após quitação
    await pool.query(`
      ALTER TABLE usuarios_adv
        ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending';
      ALTER TABLE usuarios_adv
        ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(120);
      ALTER TABLE usuarios_adv
        ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMP;

      UPDATE usuarios_adv
      SET payment_status = 'pending'
      WHERE payment_status IS NULL;

      CREATE INDEX IF NOT EXISTS idx_usuarios_adv_payment_status
        ON usuarios_adv(payment_status);
    `);

    // Migração 9: Auditoria geral e rastreio de envio de e-mails
    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_audit_logs (
        id BIGSERIAL PRIMARY KEY,
        service_name VARCHAR(50) NOT NULL,
        method VARCHAR(10) NOT NULL,
        path TEXT NOT NULL,
        status_code INTEGER,
        duration_ms INTEGER,
        user_id INTEGER,
        ip_address VARCHAR(64),
        user_agent TEXT,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_system_audit_logs_service_created_at
        ON system_audit_logs(service_name, created_at DESC);

      CREATE TABLE IF NOT EXISTS email_delivery_logs (
        id BIGSERIAL PRIMARY KEY,
        recipient_email TEXT NOT NULL,
        subject TEXT NOT NULL,
        template_name VARCHAR(120),
        status VARCHAR(40) NOT NULL DEFAULT 'queued',
        attempts INTEGER NOT NULL DEFAULT 0,
        error_message TEXT,
        metadata JSONB DEFAULT '{}'::jsonb,
        sent_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_email_delivery_logs_status_created_at
        ON email_delivery_logs(status, created_at DESC);
    `);

    // Migração 10: Registro histórico de pagamentos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payment_records (
        id             BIGSERIAL PRIMARY KEY,
        user_id        INTEGER REFERENCES usuarios_adv(id) ON DELETE SET NULL,
        plan_id        VARCHAR(50),
        amount         NUMERIC(10, 2),
        currency       VARCHAR(10)  NOT NULL DEFAULT 'BRL',
        status         VARCHAR(40)  NOT NULL DEFAULT 'pending',
        gateway        VARCHAR(50)  NOT NULL DEFAULT 'asaas',
        gateway_payment_id VARCHAR(255),
        gateway_event  VARCHAR(100),
        payment_reference VARCHAR(255),
        payer_email_hash  VARCHAR(255),
        metadata       JSONB        NOT NULL DEFAULT '{}'::jsonb,
        confirmed_at   TIMESTAMP,
        created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_payment_records_user_id
        ON payment_records(user_id);
      CREATE INDEX IF NOT EXISTS idx_payment_records_status_created_at
        ON payment_records(status, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_payment_records_gateway_payment_id
        ON payment_records(gateway_payment_id);
      CREATE INDEX IF NOT EXISTS idx_payment_records_payment_reference
        ON payment_records(payment_reference);
    `);

    // Migração 11: Tabelas do clients-service (clientes, períodos, casos, petições, eventos)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS clientes_adv (
        id VARCHAR(36) PRIMARY KEY,
        advogado_id INTEGER NOT NULL,
        nome_completo TEXT,
        cpf TEXT,
        cpf_hash VARCHAR(255),
        dados_sensiveis_hash JSONB DEFAULT '{}'::jsonb,
        email TEXT,
        email_hash VARCHAR(255),
        telefone TEXT,
        telefone_hash VARCHAR(255),
        cep TEXT,
        endereco_completo TEXT,
        estado_civil VARCHAR(50),
        data_nascimento TEXT,
        profissao VARCHAR(100),
        rg TEXT,
        rg_hash VARCHAR(255),
        cidade_uf TEXT,
        contribuicao_mensal VARCHAR(50),
        valor_dano_moral VARCHAR(50),
        valor_da_causa VARCHAR(50),
        possui_deficiencia BOOLEAN DEFAULT FALSE,
        tipo_deficiencia TEXT,
        data_laudo TEXT,
        cid TEXT,
        grau_deficiencia_ifbra TEXT,
        documento_comprobatorio_nome VARCHAR(255),
        sexo_previdenciario VARCHAR(20),
        calculo_previdenciario JSONB DEFAULT '{}'::jsonb,
        observacoes_juridicas TEXT,
        endereco_escritorio TEXT,
        endereco_df_iprev TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      ALTER TABLE clientes_adv ADD COLUMN IF NOT EXISTS dados_sensiveis_hash JSONB DEFAULT '{}'::jsonb;
      ALTER TABLE clientes_adv ADD COLUMN IF NOT EXISTS email_hash VARCHAR(255);
      ALTER TABLE clientes_adv ADD COLUMN IF NOT EXISTS telefone_hash VARCHAR(255);
      ALTER TABLE clientes_adv ADD COLUMN IF NOT EXISTS cpf_hash VARCHAR(255);
      ALTER TABLE clientes_adv ADD COLUMN IF NOT EXISTS rg_hash VARCHAR(255);
      ALTER TABLE clientes_adv ADD COLUMN IF NOT EXISTS sexo_previdenciario VARCHAR(20);
      ALTER TABLE clientes_adv ADD COLUMN IF NOT EXISTS calculo_previdenciario JSONB DEFAULT '{}'::jsonb;
      ALTER TABLE clientes_adv ADD COLUMN IF NOT EXISTS observacoes_juridicas TEXT;
      ALTER TABLE clientes_adv ADD COLUMN IF NOT EXISTS endereco_escritorio TEXT;
      ALTER TABLE clientes_adv ADD COLUMN IF NOT EXISTS endereco_df_iprev TEXT;
      ALTER TABLE clientes_adv ADD COLUMN IF NOT EXISTS grau_deficiencia_ifbra TEXT;
      ALTER TABLE clientes_adv ADD COLUMN IF NOT EXISTS documento_comprobatorio_nome VARCHAR(255);
    `);

    await pool.query(`
      DO $$
      DECLARE rec RECORD;
      BEGIN
        FOR rec IN
          SELECT column_name FROM information_schema.columns
          WHERE table_name = 'clientes_adv'
            AND column_name = ANY(ARRAY[
              'nome_completo','cpf','email','telefone','rg','cidade_uf','cep',
              'tipo_deficiencia','cid','grau_deficiencia_ifbra'
            ])
            AND data_type != 'text'
        LOOP
          EXECUTE format('ALTER TABLE clientes_adv ALTER COLUMN %I TYPE TEXT', rec.column_name);
        END LOOP;
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'clientes_adv' AND column_name = 'data_nascimento' AND data_type = 'date') THEN
          ALTER TABLE clientes_adv ALTER COLUMN data_nascimento TYPE TEXT USING data_nascimento::TEXT;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'clientes_adv' AND column_name = 'data_laudo' AND data_type = 'date') THEN
          ALTER TABLE clientes_adv ALTER COLUMN data_laudo TYPE TEXT USING data_laudo::TEXT;
        END IF;
      END $$;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS clientes_adv_periodos (
        id SERIAL PRIMARY KEY,
        cliente_id VARCHAR(36) NOT NULL,
        tipo VARCHAR(30) NOT NULL,
        data_inicio DATE,
        data_fim DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_clientes_adv_periodos_cliente') THEN
          ALTER TABLE clientes_adv_periodos
            ADD CONSTRAINT fk_clientes_adv_periodos_cliente
            FOREIGN KEY (cliente_id) REFERENCES clientes_adv(id) ON DELETE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_clientes_adv_advogado') THEN
          ALTER TABLE clientes_adv
            ADD CONSTRAINT fk_clientes_adv_advogado
            FOREIGN KEY (advogado_id) REFERENCES usuarios_adv(id) ON DELETE RESTRICT;
        END IF;
      END $$;
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_clientes_adv_advogado_id ON clientes_adv(advogado_id);
      CREATE INDEX IF NOT EXISTS idx_clientes_adv_created_at ON clientes_adv(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_clientes_adv_periodos_cliente_id ON clientes_adv_periodos(cliente_id);
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS casos_adv (
        id VARCHAR(36) PRIMARY KEY,
        advogado_id INTEGER NOT NULL,
        cliente_id VARCHAR(36),
        tipo VARCHAR(100) NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'ativo',
        data_abertura DATE NOT NULL,
        prazo DATE,
        observacoes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_casos_adv_advogado_id ON casos_adv(advogado_id);
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS peticoes_adv (
        id VARCHAR(36) PRIMARY KEY,
        advogado_id INTEGER NOT NULL,
        cliente VARCHAR(200),
        tipo VARCHAR(100) NOT NULL,
        numero_caso VARCHAR(50),
        data_documento DATE,
        conteudo TEXT,
        status VARCHAR(30) NOT NULL DEFAULT 'rascunho',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_peticoes_adv_advogado_id ON peticoes_adv(advogado_id);
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS eventos_adv (
        id VARCHAR(36) PRIMARY KEY,
        advogado_id INTEGER NOT NULL,
        titulo VARCHAR(200) NOT NULL,
        tipo VARCHAR(50) NOT NULL,
        data DATE NOT NULL,
        hora TIME,
        cliente_associado VARCHAR(200),
        numero_caso VARCHAR(50),
        local VARCHAR(200),
        observacoes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_eventos_adv_advogado_id ON eventos_adv(advogado_id);
      CREATE INDEX IF NOT EXISTS idx_eventos_adv_data ON eventos_adv(data);
    `);

    logger.info('Migrações executadas com sucesso');
  } catch (error) {
    const pgError = error as Error & {
      code?: string;
      detail?: string;
      hint?: string;
      where?: string;
      table?: string;
      column?: string;
    };

    logger.error('Erro ao executar migrações', {
      message: pgError.message,
      code: pgError.code,
      detail: pgError.detail,
      hint: pgError.hint,
      table: pgError.table,
      column: pgError.column,
      where: pgError.where,
    });
    // Não lança erro para não impedir o servidor de iniciar
  }
}

export default pool;
