// Templates de email estilizados para a Calculadora PCD

const baseStyles = `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&family=Playfair+Display:wght@600;700&display=swap');
  </style>
`;

const emailWrapper = (content: string) => `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${baseStyles}
</head>
<body style="margin: 0; padding: 0; font-family: 'Poppins', Arial, sans-serif; background: linear-gradient(135deg, #f6f8fc 0%, #e9edf4 55%, #dce3ef 100%); min-height: 100vh;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%;">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(160deg, #0e1a33 10%, #16284f 58%, #243f73 100%); padding: 30px 40px; border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="font-family: 'Poppins', Arial, sans-serif; color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                ⚖️ Calculadora PCD
              </h1>
              <p style="color: rgba(255, 255, 255, 0.85); margin: 8px 0 0 0; font-size: 14px;">
                Sistema Jurídico para Aposentadoria PCD
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="background: #ffffff; padding: 40px; border-left: 1px solid #d9e0ec; border-right: 1px solid #d9e0ec;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #f8fafc; padding: 24px 40px; border-radius: 0 0 16px 16px; border: 1px solid #d9e0ec; border-top: none; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #6a7891;">
                Este é um email automático. Por favor, não responda diretamente.
              </p>
              <p style="margin: 0; font-size: 12px; color: #6a7891;">
                © ${new Date().getFullYear()} Calculadora PCD - Todos os direitos reservados
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export function getApprovalEmailTemplate(nome: string): string {
  const content = `
    <!-- Success Icon -->
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 80px; height: 80px; background: linear-gradient(135deg, #d4edda 0%, #a8d5b1 100%); border-radius: 50%; line-height: 80px; font-size: 40px;">
        ✓
      </div>
    </div>

    <!-- Title -->
    <h2 style="font-family: 'Poppins', Arial, sans-serif; color: #0f1f3b; text-align: center; margin: 0 0 8px 0; font-size: 24px;">
      Cadastro Aprovado!
    </h2>
    <p style="color: #155724; text-align: center; margin: 0 0 30px 0; font-size: 14px; font-weight: 500;">
      Sua solicitação foi aprovada com sucesso
    </p>

    <!-- Message Box -->
    <div style="background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px; border-left: 4px solid #28a745;">
      <p style="color: #155724; margin: 0 0 16px 0; font-size: 16px;">
        Olá, <strong>${nome}</strong>!
      </p>
      <p style="color: #155724; margin: 0; font-size: 14px; line-height: 1.6;">
        Temos o prazer de informar que seu cadastro na <strong>Calculadora PCD</strong> foi <strong>aprovado</strong> pela nossa equipe de administração!
      </p>
    </div>

    <!-- Details -->
    <div style="background: #f8fafc; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
      <h3 style="color: #27364f; margin: 0 0 16px 0; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
        📋 O que você pode fazer agora:
      </h3>
      <ul style="margin: 0; padding: 0 0 0 20px; color: #5f6e89; font-size: 14px; line-height: 1.8;">
        <li>Acessar o sistema com seu CPF e senha</li>
        <li>Gerenciar clientes e processos</li>
        <li>Gerar petições automaticamente</li>
        <li>Calcular benefícios PCD</li>
      </ul>
    </div>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 32px 0;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/loginpage"
         style="display: inline-block; background: linear-gradient(90deg, #1a3058, #274b88); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; font-size: 14px; box-shadow: 0 4px 15px rgba(26, 48, 88, 0.3);">
        Acessar o Sistema →
      </a>
    </div>

    <!-- Support -->
    <p style="text-align: center; color: #6a7891; font-size: 13px; margin: 0;">
      Dúvidas? Entre em contato com nosso suporte.
    </p>
  `;

  return emailWrapper(content);
}

export function getRejectionEmailTemplate(nome: string, motivo?: string): string {
  const motivoText = motivo || 'Os documentos enviados não puderam ser validados ou estão em desacordo com as informações fornecidas.';

  const content = `
    <!-- Warning Icon -->
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 80px; height: 80px; background: linear-gradient(135deg, #fdeaea 0%, #f3b3b3 100%); border-radius: 50%; line-height: 80px; font-size: 40px;">
        ✕
      </div>
    </div>

    <!-- Title -->
    <h2 style="font-family: 'Poppins', Arial, sans-serif; color: #0f1f3b; text-align: center; margin: 0 0 8px 0; font-size: 24px;">
      Cadastro Não Aprovado
    </h2>
    <p style="color: #a52828; text-align: center; margin: 0 0 30px 0; font-size: 14px; font-weight: 500;">
      Infelizmente não foi possível aprovar sua solicitação
    </p>

    <!-- Message Box -->
    <div style="background: linear-gradient(135deg, #fdeaea 0%, #fce4e4 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px; border-left: 4px solid #dc3545;">
      <p style="color: #721c24; margin: 0 0 16px 0; font-size: 16px;">
        Olá, <strong>${nome}</strong>,
      </p>
      <p style="color: #721c24; margin: 0; font-size: 14px; line-height: 1.6;">
        Após análise cuidadosa, infelizmente não foi possível aprovar seu cadastro na <strong>Calculadora PCD</strong>.
      </p>
    </div>

    <!-- Reason Box -->
    <div style="background: #fff3cd; border-radius: 10px; padding: 20px; margin-bottom: 24px; border-left: 4px solid #ffc107;">
      <h3 style="color: #856404; margin: 0 0 12px 0; font-size: 14px; font-weight: 600;">
        ⚠️ Motivo:
      </h3>
      <p style="color: #856404; margin: 0; font-size: 14px; line-height: 1.6;">
        ${motivoText}
      </p>
    </div>

    <!-- Next Steps -->
    <div style="background: #f8fafc; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
      <h3 style="color: #27364f; margin: 0 0 16px 0; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
        📋 O que você pode fazer:
      </h3>
      <ul style="margin: 0; padding: 0 0 0 20px; color: #5f6e89; font-size: 14px; line-height: 1.8;">
        <li>Verificar se todas as informações estão corretas</li>
        <li>Enviar uma foto mais clara da carteira OAB</li>
        <li>Realizar um novo cadastro com os dados corretos</li>
        <li>Entrar em contato com o suporte para esclarecimentos</li>
      </ul>
    </div>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 32px 0;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/cadastro"
         style="display: inline-block; background: linear-gradient(90deg, #5f6e89, #7a8ba5); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; font-size: 14px; box-shadow: 0 4px 15px rgba(95, 110, 137, 0.3);">
        Tentar Novo Cadastro
      </a>
    </div>

    <!-- Support -->
    <p style="text-align: center; color: #6a7891; font-size: 13px; margin: 0;">
      Se você acredita que houve um erro, entre em contato com nossa equipe.
    </p>
  `;

  return emailWrapper(content);
}

export function getDeactivationEmailTemplate(nome: string): string {
  const content = `
    <!-- Warning Icon -->
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 80px; height: 80px; background: linear-gradient(135deg, #fff3cd 0%, #ffeeba 100%); border-radius: 50%; line-height: 80px; font-size: 40px;">
        ⚠️
      </div>
    </div>

    <!-- Title -->
    <h2 style="font-family: 'Poppins', Arial, sans-serif; color: #0f1f3b; text-align: center; margin: 0 0 8px 0; font-size: 24px;">
      Conta Desativada
    </h2>
    <p style="color: #856404; text-align: center; margin: 0 0 30px 0; font-size: 14px; font-weight: 500;">
      Sua conta foi temporariamente desativada
    </p>

    <!-- Message Box -->
    <div style="background: linear-gradient(135deg, #fff3cd 0%, #ffeeba 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px; border-left: 4px solid #ffc107;">
      <p style="color: #856404; margin: 0 0 16px 0; font-size: 16px;">
        Olá, <strong>${nome}</strong>,
      </p>
      <p style="color: #856404; margin: 0; font-size: 14px; line-height: 1.6;">
        Informamos que sua conta na <strong>Calculadora PCD</strong> foi <strong>desativada</strong> por um administrador do sistema.
      </p>
    </div>

    <!-- Info Box -->
    <div style="background: #f8fafc; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
      <h3 style="color: #27364f; margin: 0 0 16px 0; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
        ℹ️ O que isso significa:
      </h3>
      <ul style="margin: 0; padding: 0 0 0 20px; color: #5f6e89; font-size: 14px; line-height: 1.8;">
        <li>Você não poderá fazer login no sistema temporariamente</li>
        <li>Seus dados e clientes estão preservados</li>
        <li>A conta pode ser reativada a qualquer momento</li>
        <li>Entre em contato para mais informações</li>
      </ul>
    </div>

    <!-- Support -->
    <p style="text-align: center; color: #6a7891; font-size: 13px; margin: 0;">
      Caso tenha dúvidas sobre a desativação, entre em contato com a administração.
    </p>
  `;

  return emailWrapper(content);
}

export function getReactivationEmailTemplate(nome: string): string {
  const content = `
    <!-- Success Icon -->
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 80px; height: 80px; background: linear-gradient(135deg, #cce5ff 0%, #b3d7ff 100%); border-radius: 50%; line-height: 80px; font-size: 40px;">
        🔓
      </div>
    </div>

    <!-- Title -->
    <h2 style="font-family: 'Poppins', Arial, sans-serif; color: #0f1f3b; text-align: center; margin: 0 0 8px 0; font-size: 24px;">
      Conta Reativada!
    </h2>
    <p style="color: #004085; text-align: center; margin: 0 0 30px 0; font-size: 14px; font-weight: 500;">
      Sua conta foi reativada com sucesso
    </p>

    <!-- Message Box -->
    <div style="background: linear-gradient(135deg, #cce5ff 0%, #b8daff 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px; border-left: 4px solid #007bff;">
      <p style="color: #004085; margin: 0 0 16px 0; font-size: 16px;">
        Olá, <strong>${nome}</strong>!
      </p>
      <p style="color: #004085; margin: 0; font-size: 14px; line-height: 1.6;">
        Boas notícias! Sua conta na <strong>Calculadora PCD</strong> foi <strong>reativada</strong> e você já pode acessar o sistema normalmente.
      </p>
    </div>

    <!-- Details -->
    <div style="background: #f8fafc; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
      <h3 style="color: #27364f; margin: 0 0 16px 0; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
        ✅ Acesso restaurado:
      </h3>
      <ul style="margin: 0; padding: 0 0 0 20px; color: #5f6e89; font-size: 14px; line-height: 1.8;">
        <li>Login disponível com seu CPF e senha</li>
        <li>Todos os seus dados foram preservados</li>
        <li>Continue de onde parou normalmente</li>
      </ul>
    </div>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 32px 0;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/loginpage"
         style="display: inline-block; background: linear-gradient(90deg, #1a3058, #274b88); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; font-size: 14px; box-shadow: 0 4px 15px rgba(26, 48, 88, 0.3);">
        Acessar o Sistema →
      </a>
    </div>

    <!-- Support -->
    <p style="text-align: center; color: #6a7891; font-size: 13px; margin: 0;">
      Bem-vindo de volta! Estamos felizes em tê-lo conosco novamente.
    </p>
  `;

  return emailWrapper(content);
}

export function getPendingAnalysisEmailTemplate(nome: string): string {
  const content = `
    <!-- Clock Icon -->
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 80px; height: 80px; background: linear-gradient(135deg, #e8f4fd 0%, #c9e4f9 100%); border-radius: 50%; line-height: 80px; font-size: 40px;">
        ⏳
      </div>
    </div>

    <!-- Title -->
    <h2 style="font-family: 'Poppins', Arial, sans-serif; color: #0f1f3b; text-align: center; margin: 0 0 8px 0; font-size: 24px;">
      Conta Criada com Sucesso!
    </h2>
    <p style="color: #0c5460; text-align: center; margin: 0 0 30px 0; font-size: 14px; font-weight: 500;">
      Aguardando análise da documentação
    </p>

    <!-- Message Box -->
    <div style="background: linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px; border-left: 4px solid #17a2b8;">
      <p style="color: #0c5460; margin: 0 0 16px 0; font-size: 16px;">
        Olá, <strong>${nome}</strong>!
      </p>
      <p style="color: #0c5460; margin: 0; font-size: 14px; line-height: 1.6;">
        Seu cadastro na <strong>Calculadora PCD</strong> foi recebido com sucesso! Agora sua documentação será analisada pela nossa equipe de administração.
      </p>
    </div>

    <!-- Timeline Box -->
    <div style="background: linear-gradient(135deg, #fff9e6 0%, #fff3cd 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px; border-left: 4px solid #ffc107; text-align: center;">
      <div style="font-size: 48px; margin-bottom: 12px;">📅</div>
      <h3 style="color: #856404; margin: 0 0 8px 0; font-size: 18px; font-weight: 600;">
        Prazo de Análise
      </h3>
      <p style="color: #856404; margin: 0; font-size: 24px; font-weight: 700;">
        Até 3 dias úteis
      </p>
      <p style="color: #856404; margin: 8px 0 0 0; font-size: 13px;">
        Você receberá um email assim que a análise for concluída
      </p>
    </div>

    <!-- Info Box -->
    <div style="background: #f8fafc; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
      <h3 style="color: #27364f; margin: 0 0 16px 0; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
        📋 O que será analisado:
      </h3>
      <ul style="margin: 0; padding: 0 0 0 20px; color: #5f6e89; font-size: 14px; line-height: 1.8;">
        <li>Verificação da foto da carteira OAB</li>
        <li>Validação do número de registro</li>
        <li>Confirmação dos dados cadastrais</li>
        <li>Conformidade com os requisitos do sistema</li>
      </ul>
    </div>

    <!-- Next Steps -->
    <div style="background: #f8fafc; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
      <h3 style="color: #27364f; margin: 0 0 16px 0; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
        📧 Próximos passos:
      </h3>
      <ul style="margin: 0; padding: 0 0 0 20px; color: #5f6e89; font-size: 14px; line-height: 1.8;">
        <li><strong>Aprovado:</strong> Você receberá um email de confirmação e poderá acessar o sistema</li>
        <li><strong>Pendências:</strong> Caso haja algum problema, entraremos em contato com instruções</li>
      </ul>
    </div>

    <!-- Support -->
    <p style="text-align: center; color: #6a7891; font-size: 13px; margin: 0;">
      Agradecemos sua paciência! Em caso de dúvidas, entre em contato com nosso suporte.
    </p>
  `;

  return emailWrapper(content);
}

export function getEmailVerificationTemplate(nome: string, code: string): string {
  const content = `
    <!-- Email Icon -->
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 80px; height: 80px; background: linear-gradient(135deg, #e8f4fd 0%, #c9e4f9 100%); border-radius: 50%; line-height: 80px; font-size: 40px;">
        ✉️
      </div>
    </div>

    <!-- Title -->
    <h2 style="font-family: 'Poppins', Arial, sans-serif; color: #0f1f3b; text-align: center; margin: 0 0 8px 0; font-size: 24px;">
      Verifique seu E-mail
    </h2>
    <p style="color: #0c5460; text-align: center; margin: 0 0 30px 0; font-size: 14px; font-weight: 500;">
      Confirme seu endereço de e-mail para continuar
    </p>

    <!-- Message Box -->
    <div style="background: linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px; border-left: 4px solid #17a2b8;">
      <p style="color: #0c5460; margin: 0 0 16px 0; font-size: 16px;">
        Olá, <strong>${nome}</strong>!
      </p>
      <p style="color: #0c5460; margin: 0; font-size: 14px; line-height: 1.6;">
        Para completar seu cadastro na <strong>Calculadora PCD</strong>, insira o código abaixo na página de verificação:
      </p>
    </div>

    <!-- Code Box -->
    <div style="text-align: center; margin: 32px 0;">
      <div style="display: inline-block; background: linear-gradient(135deg, #0e1a33 10%, #16284f 58%, #243f73 100%); border-radius: 12px; padding: 20px 40px;">
        <span style="font-family: 'Courier New', monospace; font-size: 36px; font-weight: 700; color: #ffffff; letter-spacing: 8px;">
          ${code}
        </span>
      </div>
    </div>

    <!-- Expiry Warning -->
    <div style="background: linear-gradient(135deg, #fff9e6 0%, #fff3cd 100%); border-radius: 12px; padding: 16px 24px; margin-bottom: 24px; border-left: 4px solid #ffc107; text-align: center;">
      <p style="color: #856404; margin: 0; font-size: 14px;">
        ⏰ Este código expira em <strong>15 minutos</strong>.
      </p>
    </div>

    <!-- Support -->
    <p style="text-align: center; color: #6a7891; font-size: 13px; margin: 0;">
      Se você não solicitou este cadastro, ignore este e-mail.
    </p>
  `;

  return emailWrapper(content);
}

export function getPasswordResetEmailTemplate(nome: string, resetLink: string): string {
  const content = `
    <!-- Lock Icon -->
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 80px; height: 80px; background: linear-gradient(135deg, #e8e1f5 0%, #d4c8eb 100%); border-radius: 50%; line-height: 80px; font-size: 40px;">
        🔐
      </div>
    </div>

    <!-- Title -->
    <h2 style="font-family: 'Poppins', Arial, sans-serif; color: #0f1f3b; text-align: center; margin: 0 0 8px 0; font-size: 24px;">
      Redefinição de Senha
    </h2>
    <p style="color: #5a2d82; text-align: center; margin: 0 0 30px 0; font-size: 14px; font-weight: 500;">
      Solicitação recebida com sucesso
    </p>

    <!-- Message Box -->
    <div style="background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px; border-left: 4px solid #9333ea;">
      <p style="color: #581c87; margin: 0 0 16px 0; font-size: 16px;">
        Olá, <strong>${nome}</strong>!
      </p>
      <p style="color: #581c87; margin: 0; font-size: 14px; line-height: 1.6;">
        Recebemos uma solicitação para redefinir a senha da sua conta na <strong>Calculadora PCD</strong>. Clique no botão abaixo para criar uma nova senha.
      </p>
    </div>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 32px 0;">
      <a href="${resetLink}"
         style="display: inline-block; background: linear-gradient(90deg, #7c3aed, #9333ea); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(124, 58, 237, 0.4);">
        🔑 Redefinir Minha Senha
      </a>
    </div>

    <!-- Expiration Warning -->
    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 10px; padding: 20px; margin-bottom: 24px; border-left: 4px solid #f59e0b; text-align: center;">
      <p style="color: #92400e; margin: 0; font-size: 14px; font-weight: 500;">
        ⏰ Este link expira em <strong>1 hora</strong>
      </p>
      <p style="color: #92400e; margin: 8px 0 0 0; font-size: 13px;">
        Após esse período, você precisará solicitar uma nova redefinição.
      </p>
    </div>

    <!-- Security Info -->
    <div style="background: #f8fafc; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
      <h3 style="color: #27364f; margin: 0 0 16px 0; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
        🛡️ Dicas de Segurança:
      </h3>
      <ul style="margin: 0; padding: 0 0 0 20px; color: #5f6e89; font-size: 14px; line-height: 1.8;">
        <li>Use uma senha com pelo menos 8 caracteres</li>
        <li>Inclua letras maiúsculas, minúsculas e números</li>
        <li>Não compartilhe sua senha com ninguém</li>
        <li>Evite usar a mesma senha em outros sites</li>
      </ul>
    </div>

    <!-- Warning Box -->
    <div style="background: #fef2f2; border-radius: 10px; padding: 16px; margin-bottom: 24px; border: 1px solid #fecaca;">
      <p style="color: #dc2626; margin: 0; font-size: 13px; text-align: center;">
        ⚠️ Se você <strong>não solicitou</strong> esta redefinição de senha, ignore este email.<br>
        Sua conta permanece segura.
      </p>
    </div>

    <!-- Support -->
    <p style="text-align: center; color: #6a7891; font-size: 13px; margin: 0;">
      Precisa de ajuda? Entre em contato com nosso suporte.
    </p>
  `;

  return emailWrapper(content);
}

export function getPasswordChangedEmailTemplate(nome: string): string {
  const content = `
    <!-- Success Icon -->
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 80px; height: 80px; background: linear-gradient(135deg, #d4edda 0%, #a8d5b1 100%); border-radius: 50%; line-height: 80px; font-size: 40px;">
        ✓
      </div>
    </div>

    <!-- Title -->
    <h2 style="font-family: 'Poppins', Arial, sans-serif; color: #0f1f3b; text-align: center; margin: 0 0 8px 0; font-size: 24px;">
      Senha Alterada com Sucesso!
    </h2>
    <p style="color: #155724; text-align: center; margin: 0 0 30px 0; font-size: 14px; font-weight: 500;">
      Sua nova senha está ativa
    </p>

    <!-- Message Box -->
    <div style="background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px; border-left: 4px solid #28a745;">
      <p style="color: #155724; margin: 0 0 16px 0; font-size: 16px;">
        Olá, <strong>${nome}</strong>!
      </p>
      <p style="color: #155724; margin: 0; font-size: 14px; line-height: 1.6;">
        Sua senha na <strong>Calculadora PCD</strong> foi alterada com sucesso. Você já pode acessar o sistema com sua nova senha.
      </p>
    </div>

    <!-- Info Box -->
    <div style="background: #f8fafc; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
      <h3 style="color: #27364f; margin: 0 0 12px 0; font-size: 14px; font-weight: 600;">
        📅 Detalhes da alteração:
      </h3>
      <p style="color: #5f6e89; margin: 0; font-size: 14px;">
        Data e hora: <strong>${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</strong>
      </p>
    </div>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 32px 0;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/loginpage"
         style="display: inline-block; background: linear-gradient(90deg, #1a3058, #274b88); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; font-size: 14px; box-shadow: 0 4px 15px rgba(26, 48, 88, 0.3);">
        Acessar o Sistema →
      </a>
    </div>

    <!-- Warning Box -->
    <div style="background: #fef2f2; border-radius: 10px; padding: 16px; margin-bottom: 24px; border: 1px solid #fecaca;">
      <p style="color: #dc2626; margin: 0; font-size: 13px; text-align: center;">
        ⚠️ Se você <strong>não realizou</strong> esta alteração, entre em contato imediatamente<br>
        com nossa equipe de suporte.
      </p>
    </div>

    <!-- Support -->
    <p style="text-align: center; color: #6a7891; font-size: 13px; margin: 0;">
      Dúvidas? Entre em contato com nosso suporte.
    </p>
  `;

  return emailWrapper(content);
}
