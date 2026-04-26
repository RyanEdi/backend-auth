import nodemailer from 'nodemailer';
import {
  getApprovalEmailTemplate,
  getRejectionEmailTemplate,
  getDeactivationEmailTemplate,
  getReactivationEmailTemplate,
  getPendingAnalysisEmailTemplate,
  getPasswordResetEmailTemplate,
  getPasswordChangedEmailTemplate,
  getEmailVerificationTemplate
} from '../templates/emailTemplates';

// Configuração do transporter
// Em produção, use variáveis de ambiente para as credenciais
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true para 465, false para outras portas
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

interface EmailJob extends EmailOptions {
  attempts: number;
}

const MAX_EMAIL_RETRIES = Math.max(1, Number(process.env.EMAIL_MAX_RETRIES || '3'));
const EMAIL_RETRY_DELAY_MS = Math.max(300, Number(process.env.EMAIL_RETRY_DELAY_MS || '1000'));
const emailQueue: EmailJob[] = [];
let isProcessingQueue = false;

const wait = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

async function dispatchEmail(options: EmailOptions): Promise<void> {
  await transporter.sendMail({
    from: `"Calculadora PCD" <${process.env.SMTP_USER}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });
}

async function processEmailQueue(): Promise<void> {
  if (isProcessingQueue) {
    return;
  }

  isProcessingQueue = true;
  try {
    while (emailQueue.length > 0) {
      const job = emailQueue.shift();
      if (!job) {
        continue;
      }

      try {
        await dispatchEmail(job);
        console.log(`✅ Email enviado para: ${job.to}`);
      } catch (error) {
        const nextAttempt = job.attempts + 1;
        if (nextAttempt < MAX_EMAIL_RETRIES) {
          emailQueue.push({ ...job, attempts: nextAttempt });
          console.warn(`⚠️ Falha no envio para ${job.to}. Tentativa ${nextAttempt + 1}/${MAX_EMAIL_RETRIES}.`);
          await wait(EMAIL_RETRY_DELAY_MS * nextAttempt);
        } else {
          console.error(`❌ Falha definitiva ao enviar email para: ${job.to}`, error);
        }
      }
    }
  } finally {
    isProcessingQueue = false;
  }
}

async function sendEmail(options: EmailOptions): Promise<boolean> {
  // Se não houver credenciais configuradas, apenas loga
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('⚠️ Credenciais de email não configuradas. Email não enviado.');
    console.log(`📧 Para: ${options.to}`);
    console.log(`📝 Assunto: ${options.subject}`);
    console.log(`📄 Corpo: ${options.text}`);
    return false;
  }

  emailQueue.push({ ...options, attempts: 0 });
  void processEmailQueue();
  return true;
}

export async function sendApprovalEmail(email: string, nome: string): Promise<boolean> {
  const textBody = `
Olá, ${nome}!

CADASTRO APROVADO ✓

Temos o prazer de informar que seu cadastro na Calculadora PCD foi aprovado pela nossa equipe de administração!

O que você pode fazer agora:
• Acessar o sistema com seu CPF e senha
• Gerenciar clientes e processos
• Gerar petições automaticamente
• Calcular benefícios PCD

Acesse: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/loginpage

Dúvidas? Entre em contato com nosso suporte.

---
Calculadora PCD - Sistema Jurídico para Aposentadoria PCD
Este é um email automático. Por favor, não responda diretamente.
  `.trim();

  return sendEmail({
    to: email,
    subject: '✅ Cadastro Aprovado - Calculadora PCD',
    html: getApprovalEmailTemplate(nome),
    text: textBody,
  });
}

export async function sendRejectionEmail(email: string, nome: string, motivo?: string): Promise<boolean> {
  const motivoTexto = motivo || 'Os documentos enviados não puderam ser validados ou estão em desacordo com as informações fornecidas.';

  const textBody = `
Olá, ${nome},

CADASTRO NÃO APROVADO ✕

Após análise cuidadosa, infelizmente não foi possível aprovar seu cadastro na Calculadora PCD.

MOTIVO:
${motivoTexto}

O que você pode fazer:
• Verificar se todas as informações estão corretas
• Enviar uma foto mais clara da carteira OAB
• Realizar um novo cadastro com os dados corretos
• Entrar em contato com o suporte para esclarecimentos

Se você acredita que houve um erro, entre em contato com nossa equipe.

---
Calculadora PCD - Sistema Jurídico para Aposentadoria PCD
Este é um email automático. Por favor, não responda diretamente.
  `.trim();

  return sendEmail({
    to: email,
    subject: '❌ Cadastro Não Aprovado - Calculadora PCD',
    html: getRejectionEmailTemplate(nome, motivo),
    text: textBody,
  });
}

export async function sendDeactivationEmail(email: string, nome: string): Promise<boolean> {
  const textBody = `
Olá, ${nome},

CONTA DESATIVADA ⚠️

Informamos que sua conta na Calculadora PCD foi desativada por um administrador do sistema.

O que isso significa:
• Você não poderá fazer login no sistema temporariamente
• Seus dados e clientes estão preservados
• A conta pode ser reativada a qualquer momento
• Entre em contato para mais informações

Caso tenha dúvidas sobre a desativação, entre em contato com a administração.

---
Calculadora PCD - Sistema Jurídico para Aposentadoria PCD
Este é um email automático. Por favor, não responda diretamente.
  `.trim();

  return sendEmail({
    to: email,
    subject: '⚠️ Conta Desativada - Calculadora PCD',
    html: getDeactivationEmailTemplate(nome),
    text: textBody,
  });
}

export async function sendReactivationEmail(email: string, nome: string): Promise<boolean> {
  const textBody = `
Olá, ${nome}!

CONTA REATIVADA ✓

Boas notícias! Sua conta na Calculadora PCD foi reativada e você já pode acessar o sistema normalmente.

Acesso restaurado:
• Login disponível com seu CPF e senha
• Todos os seus dados foram preservados
• Continue de onde parou normalmente

Acesse: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/loginpage

Bem-vindo de volta! Estamos felizes em tê-lo conosco novamente.

---
Calculadora PCD - Sistema Jurídico para Aposentadoria PCD
Este é um email automático. Por favor, não responda diretamente.
  `.trim();

  return sendEmail({
    to: email,
    subject: '✅ Conta Reativada - Calculadora PCD',
    html: getReactivationEmailTemplate(nome),
    text: textBody,
  });
}

export async function sendPendingAnalysisEmail(email: string, nome: string): Promise<boolean> {
  const textBody = `
Olá, ${nome}!

CONTA CRIADA COM SUCESSO ⏳

Seu cadastro na Calculadora PCD foi recebido com sucesso!
Agora sua documentação será analisada pela nossa equipe de administração.

PRAZO DE ANÁLISE: Até 3 dias úteis

Você receberá um email assim que a análise for concluída.

O que será analisado:
• Verificação da foto da carteira OAB
• Validação do número de registro
• Confirmação dos dados cadastrais
• Conformidade com os requisitos do sistema

Próximos passos:
• Aprovado: Você receberá um email de confirmação e poderá acessar o sistema
• Pendências: Caso haja algum problema, entraremos em contato com instruções

Agradecemos sua paciência! Em caso de dúvidas, entre em contato com nosso suporte.

---
Calculadora PCD - Sistema Jurídico para Aposentadoria PCD
Este é um email automático. Por favor, não responda diretamente.
  `.trim();

  return sendEmail({
    to: email,
    subject: '⏳ Cadastro Recebido - Aguardando Análise - Calculadora PCD',
    html: getPendingAnalysisEmailTemplate(nome),
    text: textBody,
  });
}

export async function sendPasswordResetEmail(email: string, nome: string, resetLink: string): Promise<boolean> {
  const textBody = `
Olá, ${nome}!

REDEFINIÇÃO DE SENHA 🔐

Recebemos uma solicitação para redefinir a senha da sua conta na Calculadora PCD.

Clique no link abaixo para criar uma nova senha:
${resetLink}

⏰ IMPORTANTE: Este link expira em 1 hora.
Após esse período, você precisará solicitar uma nova redefinição.

Dicas de Segurança:
• Use uma senha com pelo menos 8 caracteres
• Inclua letras maiúsculas, minúsculas e números
• Não compartilhe sua senha com ninguém
• Evite usar a mesma senha em outros sites

⚠️ Se você NÃO solicitou esta redefinição de senha, ignore este email.
Sua conta permanece segura.

Precisa de ajuda? Entre em contato com nosso suporte.

---
Calculadora PCD - Sistema Jurídico para Aposentadoria PCD
Este é um email automático. Por favor, não responda diretamente.
  `.trim();

  return sendEmail({
    to: email,
    subject: '🔐 Redefinição de Senha - Calculadora PCD',
    html: getPasswordResetEmailTemplate(nome, resetLink),
    text: textBody,
  });
}

export async function sendPasswordChangedEmail(email: string, nome: string): Promise<boolean> {
  const textBody = `
Olá, ${nome}!

SENHA ALTERADA COM SUCESSO ✓

Sua senha na Calculadora PCD foi alterada com sucesso.
Você já pode acessar o sistema com sua nova senha.

Data e hora: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}

Acesse: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/loginpage

⚠️ Se você NÃO realizou esta alteração, entre em contato imediatamente
com nossa equipe de suporte.

Dúvidas? Entre em contato com nosso suporte.

---
Calculadora PCD - Sistema Jurídico para Aposentadoria PCD
Este é um email automático. Por favor, não responda diretamente.
  `.trim();

  return sendEmail({
    to: email,
    subject: '✅ Senha Alterada - Calculadora PCD',
    html: getPasswordChangedEmailTemplate(nome),
    text: textBody,
  });
}

export async function sendEmailVerificationCode(email: string, nome: string, code: string): Promise<boolean> {
  const textBody = `
Olá, ${nome}!

VERIFICAÇÃO DE E-MAIL ✉️

Para completar seu cadastro na Calculadora PCD, insira o código abaixo:

CÓDIGO: ${code}

⏰ Este código expira em 15 minutos.

Se você não solicitou este cadastro, ignore este e-mail.

---
Calculadora PCD - Sistema Jurídico para Aposentadoria PCD
Este é um email automático. Por favor, não responda diretamente.
  `.trim();

  return sendEmail({
    to: email,
    subject: '✉️ Código de Verificação - Calculadora PCD',
    html: getEmailVerificationTemplate(nome, code),
    text: textBody,
  });
}
