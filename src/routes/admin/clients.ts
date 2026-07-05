import { Router, Request, Response } from 'express';
import pool from '../../config/database';
import { onlyDigits, sanitizeText, hashCpf, hashEmail } from '../../utils/sanitizers';
import { v4 as uuidv4 } from 'uuid';
import logger from '../../utils/logger';
import multer from 'multer';

const router = Router();

// Configuração do multer para processar FormData (arquivos e texto) em memória
const upload = multer();

// POST /api/clients - Cadastrar novo cliente
router.post('/', upload.single('documentoComprobatorio'), async (req: Request, res: Response) => {
  logger.debug('POST /api/clients recebido');
  
  // Usamos client.query em vez de pool.query para garantir que a inserção 
  // do cliente e dos períodos ocorram na mesma transação (BEGIN / COMMIT).
  const client = await pool.connect();
  
  try {
    const {
      name,
      cpf,
      dataNascimento,
      email,
      telefone,
      cep,
      address,
      estadoCivil,
      profissao,
      cidadeUf,
      contribuicaoMensal,
      valorDanoMoral,
      valorDaCausa,
      possuiDeficiencia,
      tipoDeficiencia,
      dataLaudo,
      cid,
      grauDeficienciaIfbra,
      documentoComprobatorioNome,
      sexoPrevidenciario,
      observacoesJuridicas,
      periodos,
      calculoPrevidenciario
    } = req.body;

    // Recupera advogado_id da sessão ou do header
    const advogadoId = req.session?.usuarioId || req.header('x-user-id');
    if (!advogadoId) {
      return res.status(401).json({ success: false, message: 'Usuário não autenticado.' });
    }

    // Validação básica
    if (!name || !cpf) {
      logger.warn('POST /api/clients: nome e CPF obrigatórios');
      return res.status(400).json({ success: false, message: 'Nome e CPF são obrigatórios.' });
    }

    // Geração e higienização de dados
    const id = uuidv4();
    const cpfLimpo = onlyDigits(cpf);
    const cpfHash = hashCpf(cpfLimpo);
    const emailHash = email ? hashEmail(email) : null;
    const telefoneHash = telefone ? hashCpf(onlyDigits(telefone)) : null;
    
    // Tratamento do booleano que vem como string 'true'/'false' devido ao FormData
    const isPcd = possuiDeficiencia === 'true' || possuiDeficiencia === true;
    
    // Extrai o nome do arquivo diretamente do multer, se houver
    const docNome = req.file?.originalname || documentoComprobatorioNome || null;

    // Converte os dados que vieram como string do FormData para arrays/objetos JS
    let periodosParsed = [];
    try {
      periodosParsed = typeof periodos === 'string' ? JSON.parse(periodos) : (periodos || []);
    } catch (e) {
      logger.warn('Erro ao fazer parse dos periodos');
    }

    let calculoParsed = null;
    try {
      calculoParsed = typeof calculoPrevidenciario === 'string' ? JSON.parse(calculoPrevidenciario) : calculoPrevidenciario;
    } catch (e) {
      logger.warn('Erro ao fazer parse do calculo_previdenciario');
    }

    logger.debug('POST /api/clients dados', { name, cpf: cpf?.slice(0, 3) + '***' });
    logger.debug('POST /api/clients iniciando insert');

    await client.query('BEGIN'); // Inicia a transação no banco

    // 1. Insere o cliente na tabela principal (sem a coluna periodos)
    const result = await client.query(
      `INSERT INTO clientes_adv (
        id, advogado_id, nome_completo, cpf, cpf_hash, email, email_hash, telefone, telefone_hash, cep, endereco_completo, estado_civil, profissao, cidade_uf,
        contribuicao_mensal, valor_dano_moral, valor_da_causa, possui_deficiencia, tipo_deficiencia, data_laudo, cid, grau_deficiencia_ifbra,
        documento_comprobatorio_nome, sexo_previdenciario, observacoes_juridicas, calculo_previdenciario, data_nascimento
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,
        $15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26::jsonb,$27
      ) RETURNING id`,
      [
        id, 
        advogadoId, 
        sanitizeText(name), 
        cpfLimpo, 
        cpfHash, 
        sanitizeText(email), 
        emailHash, 
        onlyDigits(telefone), 
        telefoneHash, 
        onlyDigits(cep),
        sanitizeText(address), 
        sanitizeText(estadoCivil), 
        sanitizeText(profissao), 
        sanitizeText(cidadeUf),
        contribuicaoMensal || null, 
        valorDanoMoral || null, 
        valorDaCausa || null, 
        isPcd, 
        tipoDeficiencia || null, 
        dataLaudo || null, 
        cid || null, 
        grauDeficienciaIfbra || null,
        docNome, 
        sexoPrevidenciario || null, 
        observacoesJuridicas || null,
        calculoParsed ? JSON.stringify(calculoParsed) : null, 
        dataNascimento || null
      ]
    );

    // 2. Insere os períodos na tabela secundária (clientes_adv_periodos)
    if (periodosParsed && periodosParsed.length > 0) {
      for (const periodo of periodosParsed) {
        await client.query(
          `INSERT INTO clientes_adv_periodos (cliente_id, tipo, data_inicio, data_fim)
           VALUES ($1, $2, $3, $4)`,
          [
            id,
            periodo.tipo,
            periodo.inicio || null,
            periodo.fim || null
          ]
        );
      }
    }

    await client.query('COMMIT'); // Confirma as inserções se tudo der certo
    
    logger.info('POST /api/clients cliente criado', { id: result.rows[0]?.id });
    return res.status(201).json({ success: true, id: result.rows[0].id });

  } catch (err: any) {
    await client.query('ROLLBACK'); // Desfaz o cliente criado caso dê erro nos períodos
    logger.error('POST /api/clients erro', { error: err.message, stack: err.stack });
    return res.status(500).json({ success: false, message: 'Erro ao cadastrar cliente.' });
  } finally {
    client.release(); // Libera a conexão para o pool
  }
});

export default router;