/**
 * Script de teste — envia todos os templates para um endereço de destino.
 * Uso: npx ts-node test-emails.ts
 */

import nodemailer from 'nodemailer';
import {
  getApprovalEmailTemplate,
  getRejectionEmailTemplate,
  getDeactivationEmailTemplate,
  getReactivationEmailTemplate,
  getPendingAnalysisEmailTemplate,
  getEmailVerificationTemplate,
  getPasswordResetEmailTemplate,
  getPasswordChangedEmailTemplate,
} from './src/templates/emailTemplates';

const SMTP_USER = 'direitoeprovento@gmail.com';
const SMTP_PASS = 'edyf ptrg qyii hqzp';
const DESTINO   = 'jogosdatualidade@gmail.com';
const NOME_TESTE = 'Usuário Teste';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});

const emails: { subject: string; html: string }[] = [
  {
    subject: '[TESTE 1/8] Cadastro Aprovado',
    html: getApprovalEmailTemplate(NOME_TESTE),
  },
  {
    subject: '[TESTE 2/8] Cadastro Não Aprovado',
    html: getRejectionEmailTemplate(NOME_TESTE, 'Foto da carteira OAB ilegível.'),
  },
  {
    subject: '[TESTE 3/8] Conta Desativada',
    html: getDeactivationEmailTemplate(NOME_TESTE),
  },
  {
    subject: '[TESTE 4/8] Conta Reativada',
    html: getReactivationEmailTemplate(NOME_TESTE),
  },
  {
    subject: '[TESTE 5/8] Cadastro em Análise',
    html: getPendingAnalysisEmailTemplate(NOME_TESTE),
  },
  {
    subject: '[TESTE 6/8] Verificação de E-mail',
    html: getEmailVerificationTemplate(NOME_TESTE, '847291'),
  },
  {
    subject: '[TESTE 7/8] Redefinição de Senha',
    html: getPasswordResetEmailTemplate(NOME_TESTE, 'http://localhost:5181/redefinir-senha?token=abc123'),
  },
  {
    subject: '[TESTE 8/8] Senha Alterada',
    html: getPasswordChangedEmailTemplate(NOME_TESTE),
  },
];

async function run() {
  console.log(`\nVerificando conexão com o servidor SMTP...`);
  await transporter.verify();
  console.log('Conexão OK. Enviando emails...\n');

  for (let i = 0; i < emails.length; i++) {
    const { subject, html } = emails[i];
    process.stdout.write(`  Enviando: ${subject} ... `);
    await transporter.sendMail({
      from: `"Direito & Provento (Teste)" <${SMTP_USER}>`,
      to: DESTINO,
      subject,
      html,
      text: subject,
    });
    console.log('✓');
    // pequeno delay para não estourar rate limit do Gmail
    await new Promise(r => setTimeout(r, 800));
  }

  console.log(`\nTodos os ${emails.length} emails enviados para ${DESTINO}!\n`);
}

run().catch(err => {
  console.error('\nErro:', err.message);
  process.exit(1);
});
