import { Router, Request, Response } from 'express';
import pool from '../../config/database';
import { onlyDigits, sanitizeText, hashCpf, hashEmail } from '../../utils/sanitizers';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// POST /api/clients - Cadastrar novo cliente
router.post('/', async (req: Request, res: Response) => {
  console.log('[POST /api/clients] Nova requisição recebida');
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

    // Recupera advogado_id da sessão
    const advogadoId = req.session?.usuarioId || req.header('x-user-id');
    if (!advogadoId) {
      return res.status(401).json({ success: false, message: 'Usuário não autenticado.' });
    }

    // Gera UUID para o cliente
    const id = uuidv4();
    // Gera hash do CPF
    const cpfLimpo = onlyDigits(cpf);
    const cpfHash = hashCpf(cpfLimpo);
    // Gera hash do email
    const emailHash = email ? hashEmail(email) : null;
    // Gera hash do telefone
    const telefoneHash = telefone ? hashCpf(onlyDigits(telefone)) : null;

    console.log('[POST /api/clients] Dados recebidos:', { name, cpf });

    // Validação básica
    if (!name || !cpf) {
      console.log('[POST /api/clients] Falha: Nome e CPF são obrigatórios');
      return res.status(400).json({ success: false, message: 'Nome e CPF são obrigatórios.' });
    }

    console.log('[POST /api/clients] Iniciando insert no banco...');
    // Insere cliente com todos os campos obrigatórios
    const result = await pool.query(
      `INSERT INTO clientes_adv (
        id, advogado_id, nome_completo, cpf, cpf_hash, email, email_hash, telefone, telefone_hash, cep, endereco_completo, estado_civil, profissao, cidade_uf,
        contribuicao_mensal, valor_dano_moral, valor_da_causa, possui_deficiencia, tipo_deficiencia, data_laudo, cid, grau_deficiencia_ifbra,
        documento_comprobatorio_nome, sexo_previdenciario, observacoes_juridicas, periodos, calculo_previdenciario, data_nascimento
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,
        $15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27
      ) RETURNING id`,
      [
        id, advogadoId, sanitizeText(name), cpfLimpo, cpfHash, sanitizeText(email), emailHash, onlyDigits(telefone), telefoneHash, onlyDigits(cep),
        sanitizeText(address), sanitizeText(estadoCivil), sanitizeText(profissao), sanitizeText(cidadeUf),
        contribuicaoMensal, valorDanoMoral, valorDaCausa, !!possuiDeficiencia, tipoDeficiencia, dataLaudo, cid, grauDeficienciaIfbra,
        documentoComprobatorioNome, sexoPrevidenciario, observacoesJuridicas,
        JSON.stringify(periodos), JSON.stringify(calculoPrevidenciario), dataNascimento
      ]
    );
    console.log('[POST /api/clients] Insert realizado com sucesso, id:', result.rows[0]?.id);

    return res.status(201).json({ success: true, id: result.rows[0].id });
  } catch (err: any) {
    console.error('[POST /api/clients] Erro ao cadastrar cliente:', err);
    return res.status(500).json({ success: false, message: 'Erro ao cadastrar cliente.' });
  }
});

export default router;
