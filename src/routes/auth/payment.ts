import { Router, Request, Response } from 'express';
import pool from '../../config/database';
import { hashEmail, sanitizeText } from '../../utils/sanitizers';
import logger from '../../utils/logger';

const router = Router();

// Eventos que representam liquidacao efetiva e liberam a proxima etapa do cadastro.
const PAID_EVENTS = new Set([
  'PAYMENT_RECEIVED',
  'PAYMENT_CONFIRMED',
  'PAYMENT_APPROVED',
]);

// Rota POST /payment/webhook/asaas - confirma pagamento e libera etapa de aprovacao administrativa
router.post('/payment/webhook/asaas', async (req: Request, res: Response) => {
  const expectedToken = process.env.PAYMENT_WEBHOOK_TOKEN || '';
  const receivedToken = String(req.header('x-webhook-token') || '');

  // Token compartilhado evita que terceiros disparem confirmacoes falsas.
  if (expectedToken && receivedToken !== expectedToken) {
    return res.status(401).json({ success: false, message: 'Webhook token invalido.' });
  }

  const event = sanitizeText(String(req.body?.event || ''));
  // Eventos irrelevantes sao aceitos e ignorados para manter a rota sem efeitos colaterais por repeticao.
  if (!PAID_EVENTS.has(event)) {
    return res.status(200).json({ success: true, ignored: true, event });
  }

  const payment = req.body?.payment ?? {};
  const externalReference = sanitizeText(
    String(payment.externalReference || req.body?.externalReference || '')
  );
  const paymentId = sanitizeText(String(payment.id || req.body?.paymentId || ''));
  const payerEmail = sanitizeText(
    String(payment.customerEmail || req.body?.customer?.email || req.body?.email || '')
  ).toLowerCase();

  const where: string[] = [];
  const values: Array<string | number> = [];

  // A conciliacao tenta, nesta ordem, id interno, referencia do pagamento e email do pagador.
  const parsedUserId = Number(externalReference);
  if (Number.isInteger(parsedUserId) && parsedUserId > 0) {
    values.push(parsedUserId);
    where.push(`id = $${values.length}`);
  }

  if (externalReference) {
    values.push(externalReference);
    where.push(`payment_reference = $${values.length}`);
  }

  if (payerEmail) {
    values.push(hashEmail(payerEmail));
    where.push(`email_hash = $${values.length}`);
  }

  if (where.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Webhook sem identificador de usuario (externalReference/email).',
    });
  }

  try {
    values.push(paymentId || externalReference || null);
    const refIndex = values.length;

    // A atualizacao e segura para repeticao: marcar como pago novamente nao quebra o estado.
    const result = await pool.query(
      `UPDATE usuarios_adv
       SET payment_status = 'paid',
           payment_reference = COALESCE($${refIndex}, payment_reference),
           payment_confirmed_at = NOW()
       WHERE ${where.join(' OR ')}
       RETURNING id`,
      values
    );

    if ((result.rowCount ?? 0) === 0) {
      return res.status(404).json({
        success: false,
        message: 'Nenhum usuario encontrado para o pagamento informado.',
      });
    }

    // Registra cada pagamento confirmado na tabela histórica.
    const amount = Number(req.body?.payment?.value ?? req.body?.value ?? null) || null;
    const planId = sanitizeText(String(req.body?.payment?.externalDescription || req.body?.planId || '')) || null;

    await Promise.allSettled(
      result.rows.map(r =>
        pool.query(
          `INSERT INTO payment_records
             (user_id, plan_id, amount, status, gateway, gateway_payment_id,
              gateway_event, payment_reference, payer_email_hash, metadata, confirmed_at)
           VALUES ($1,$2,$3,'paid','asaas',$4,$5,$6,$7,$8::jsonb,NOW())
           ON CONFLICT DO NOTHING`,
          [
            r.id,
            planId,
            amount,
            paymentId || null,
            event,
            externalReference || null,
            payerEmail ? require('../../utils/sanitizers').hashEmail(payerEmail) : null,
            JSON.stringify(req.body?.payment ?? {}),
          ]
        )
      )
    );

    logger.info('Pagamento confirmado via webhook', {
      event,
      gatewayPaymentId: paymentId,
      updatedUsers: result.rows.map(r => r.id),
    });

    return res.status(200).json({
      success: true,
      updatedUsers: result.rows.map(r => r.id),
    });
  } catch (err) {
    logger.error('Erro ao processar webhook de pagamento', { error: (err as Error).message });
    return res.status(500).json({ success: false, message: 'Erro ao confirmar pagamento.' });
  }
});

export default router;
