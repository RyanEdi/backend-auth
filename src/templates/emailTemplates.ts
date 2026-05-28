// Templates de email estilizados — design Gmail

const emailWrapper = (content: string, accentColor = '#1a73e8') => `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Direito &amp; Provento</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f3f4;font-family:Google Sans,Roboto,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f1f3f4;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:20px;">
              <!--
                ╔══════════════════════════════════════╗
                ║        INSERIR LOGO AQUI             ║
                ║  <img src="URL_DA_LOGO"              ║
                ║       alt="Direito & Provento"          ║
                ║       height="40"                    ║
                ║       style="display:block;">        ║
                ╚══════════════════════════════════════╝
              -->
              <div style="display:inline-block;background:#ffffff;border-radius:8px;padding:12px 24px;border:1px solid #dadce0;">
                <span style="font-size:18px;font-weight:600;color:#202124;letter-spacing:-0.3px;">Direito &amp; Provento</span>
              </div>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:8px;border:1px solid #dadce0;overflow:hidden;">

              <!-- Accent bar -->
              <div style="height:4px;background-color:${accentColor};"></div>

              <!-- Body -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding:40px 48px 32px;">
                    ${content}
                  </td>
                </tr>
              </table>

              <!-- Footer inside card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding:16px 48px 24px;border-top:1px solid #e8eaed;">
                    <p style="margin:0;font-size:12px;color:#80868b;line-height:1.6;">
                      Este é um email automático — não responda diretamente.<br>
                      © ${new Date().getFullYear()} Direito &amp; Provento · Todos os direitos reservados
                    </p>
                  </td>
                </tr>
              </table>

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
    <h2 style="margin:0 0 4px;font-size:22px;font-weight:600;color:#202124;">Cadastro aprovado</h2>
    <p style="margin:0 0 28px;font-size:14px;color:#5f6368;">Sua solicitação foi analisada e aprovada.</p>

    <p style="margin:0 0 24px;font-size:15px;color:#202124;line-height:1.6;">
      Olá, <strong>${nome}</strong>! Seu cadastro na <strong>Direito &amp; Provento</strong> foi <strong style="color:#1e8e3e;">aprovado</strong> pela equipe de administração.
      Você já pode acessar o sistema com seu CPF e senha.
    </p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:28px;">
      <tr>
        <td style="background:#f8f9fa;border-radius:8px;padding:20px;border-left:3px solid #1e8e3e;">
          <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#202124;text-transform:uppercase;letter-spacing:0.5px;">O que você pode fazer agora</p>
          <ul style="margin:0;padding:0 0 0 18px;color:#5f6368;font-size:14px;line-height:1.8;">
            <li>Gerenciar clientes e processos</li>
            <li>Gerar petições automaticamente</li>
            <li>Acompanhar prazos e eventos</li>
          </ul>
        </td>
      </tr>
    </table>

    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto 28px;">
      <tr>
        <td style="border-radius:4px;background:#1a73e8;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/loginpage"
             style="display:inline-block;padding:12px 32px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:4px;">
            Acessar o sistema
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:13px;color:#80868b;text-align:center;">Dúvidas? Entre em contato com o suporte.</p>
  `;
  return emailWrapper(content, '#1e8e3e');
}

export function getRejectionEmailTemplate(nome: string, motivo?: string): string {
  const motivoText = motivo || 'Os documentos enviados não puderam ser validados ou estão em desacordo com as informações fornecidas.';

  const content = `
    <h2 style="margin:0 0 4px;font-size:22px;font-weight:600;color:#202124;">Cadastro não aprovado</h2>
    <p style="margin:0 0 28px;font-size:14px;color:#5f6368;">Infelizmente não foi possível aprovar sua solicitação.</p>

    <p style="margin:0 0 24px;font-size:15px;color:#202124;line-height:1.6;">
      Olá, <strong>${nome}</strong>. Após análise cuidadosa, seu cadastro na <strong>Direito &amp; Provento</strong> não pôde ser aprovado neste momento.
    </p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:24px;">
      <tr>
        <td style="background:#fce8e6;border-radius:8px;padding:20px;border-left:3px solid #d93025;">
          <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#c5221f;">Motivo</p>
          <p style="margin:0;font-size:14px;color:#3c1f1e;line-height:1.6;">${motivoText}</p>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:28px;">
      <tr>
        <td style="background:#f8f9fa;border-radius:8px;padding:20px;">
          <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#202124;text-transform:uppercase;letter-spacing:0.5px;">O que você pode fazer</p>
          <ul style="margin:0;padding:0 0 0 18px;color:#5f6368;font-size:14px;line-height:1.8;">
            <li>Verificar se todas as informações estão corretas</li>
            <li>Enviar uma foto mais clara da documentação</li>
            <li>Realizar um novo cadastro com os dados corretos</li>
          </ul>
        </td>
      </tr>
    </table>

    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto 28px;">
      <tr>
        <td style="border-radius:4px;background:#1a73e8;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/cadastro"
             style="display:inline-block;padding:12px 32px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:4px;">
            Tentar novo cadastro
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:13px;color:#80868b;text-align:center;">Acredita que houve um erro? Entre em contato com nossa equipe.</p>
  `;

  return emailWrapper(content, '#d93025');
}

export function getDeactivationEmailTemplate(nome: string): string {
  const content = `
    <h2 style="margin:0 0 4px;font-size:22px;font-weight:600;color:#202124;">Conta desativada</h2>
    <p style="margin:0 0 28px;font-size:14px;color:#5f6368;">Sua conta foi temporariamente desativada.</p>

    <p style="margin:0 0 24px;font-size:15px;color:#202124;line-height:1.6;">
      Olá, <strong>${nome}</strong>. Sua conta na <strong>Direito &amp; Provento</strong> foi <strong>desativada</strong> por um administrador do sistema.
    </p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:28px;">
      <tr>
        <td style="background:#fef7e0;border-radius:8px;padding:20px;border-left:3px solid #f9ab00;">
          <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#7c5800;text-transform:uppercase;letter-spacing:0.5px;">O que isso significa</p>
          <ul style="margin:0;padding:0 0 0 18px;color:#5f6368;font-size:14px;line-height:1.8;">
            <li>Você não poderá fazer login temporariamente</li>
            <li>Seus dados e clientes estão preservados</li>
            <li>A conta pode ser reativada a qualquer momento</li>
          </ul>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:13px;color:#80868b;text-align:center;">Dúvidas sobre a desativação? Entre em contato com a administração.</p>
  `;
  return emailWrapper(content, '#f9ab00');
}

export function getReactivationEmailTemplate(nome: string): string {
  const content = `
    <h2 style="margin:0 0 4px;font-size:22px;font-weight:600;color:#202124;">Conta reativada</h2>
    <p style="margin:0 0 28px;font-size:14px;color:#5f6368;">Sua conta foi reativada com sucesso.</p>

    <p style="margin:0 0 24px;font-size:15px;color:#202124;line-height:1.6;">
      Olá, <strong>${nome}</strong>! Sua conta na <strong>Direito &amp; Provento</strong> foi <strong style="color:#1e8e3e;">reativada</strong> e você já pode acessar o sistema normalmente.
    </p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:28px;">
      <tr>
        <td style="background:#f8f9fa;border-radius:8px;padding:20px;border-left:3px solid #1e8e3e;">
          <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#202124;text-transform:uppercase;letter-spacing:0.5px;">Acesso restaurado</p>
          <ul style="margin:0;padding:0 0 0 18px;color:#5f6368;font-size:14px;line-height:1.8;">
            <li>Login disponível com seu CPF e senha</li>
            <li>Todos os seus dados foram preservados</li>
            <li>Continue de onde parou normalmente</li>
          </ul>
        </td>
      </tr>
    </table>

    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto 28px;">
      <tr>
        <td style="border-radius:4px;background:#1a73e8;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/loginpage"
             style="display:inline-block;padding:12px 32px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:4px;">
            Acessar o sistema
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:13px;color:#80868b;text-align:center;">Bem-vindo de volta!</p>
  `;
  return emailWrapper(content, '#1e8e3e');
}

export function getPendingAnalysisEmailTemplate(nome: string): string {
  const content = `
    <h2 style="margin:0 0 4px;font-size:22px;font-weight:600;color:#202124;">Conta criada com sucesso</h2>
    <p style="margin:0 0 28px;font-size:14px;color:#5f6368;">Aguardando análise da documentação.</p>

    <p style="margin:0 0 24px;font-size:15px;color:#202124;line-height:1.6;">
      Olá, <strong>${nome}</strong>! Seu cadastro na <strong>Direito &amp; Provento</strong> foi recebido. Nossa equipe analisará sua documentação em breve.
    </p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:20px;">
      <tr>
        <td align="center" style="background:#f8f9fa;border-radius:8px;padding:24px;">
          <p style="margin:0 0 4px;font-size:13px;color:#5f6368;text-transform:uppercase;letter-spacing:0.5px;">Prazo de análise</p>
          <p style="margin:0;font-size:28px;font-weight:700;color:#202124;">Até 3 dias úteis</p>
          <p style="margin:4px 0 0;font-size:13px;color:#80868b;">Você receberá um email assim que a análise for concluída</p>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:28px;">
      <tr>
        <td style="background:#f8f9fa;border-radius:8px;padding:20px;">
          <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#202124;text-transform:uppercase;letter-spacing:0.5px;">O que será analisado</p>
          <ul style="margin:0;padding:0 0 0 18px;color:#5f6368;font-size:14px;line-height:1.8;">
            <li>Verificação da foto da carteira OAB</li>
            <li>Validação do número de registro</li>
            <li>Confirmação dos dados cadastrais</li>
          </ul>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:13px;color:#80868b;text-align:center;">Agradecemos sua paciência! Dúvidas? Entre em contato com o suporte.</p>
  `;
  return emailWrapper(content, '#1a73e8');
}

export function getEmailVerificationTemplate(nome: string, code: string): string {
  const content = `
    <h2 style="margin:0 0 4px;font-size:22px;font-weight:600;color:#202124;">Verifique seu e-mail</h2>
    <p style="margin:0 0 28px;font-size:14px;color:#5f6368;">Confirme seu endereço para continuar.</p>

    <p style="margin:0 0 28px;font-size:15px;color:#202124;line-height:1.6;">
      Olá, <strong>${nome}</strong>! Insira o código abaixo na página de verificação para completar seu cadastro na <strong>Direito &amp; Provento</strong>:
    </p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:24px;">
      <tr>
        <td align="center" style="background:#f8f9fa;border-radius:8px;padding:32px 24px;border:1px solid #dadce0;">
          <span style="font-family:Courier New,Courier,monospace;font-size:40px;font-weight:700;color:#1a73e8;letter-spacing:12px;">${code}</span>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:28px;">
      <tr>
        <td style="background:#fef7e0;border-radius:8px;padding:14px 20px;border-left:3px solid #f9ab00;">
          <p style="margin:0;font-size:14px;color:#7c5800;">Este código expira em <strong>15 minutos</strong>.</p>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:13px;color:#80868b;text-align:center;">Se você não solicitou este cadastro, ignore este e-mail.</p>
  `;
  return emailWrapper(content, '#1a73e8');
}

export function getPasswordResetEmailTemplate(nome: string, resetLink: string): string {
  const content = `
    <h2 style="margin:0 0 4px;font-size:22px;font-weight:600;color:#202124;">Redefinição de senha</h2>
    <p style="margin:0 0 28px;font-size:14px;color:#5f6368;">Solicitação recebida com sucesso.</p>

    <p style="margin:0 0 28px;font-size:15px;color:#202124;line-height:1.6;">
      Olá, <strong>${nome}</strong>. Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha.
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto 24px;">
      <tr>
        <td style="border-radius:4px;background:#1a73e8;">
          <a href="${resetLink}"
             style="display:inline-block;padding:12px 32px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:4px;">
            Redefinir minha senha
          </a>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:24px;">
      <tr>
        <td style="background:#fef7e0;border-radius:8px;padding:14px 20px;border-left:3px solid #f9ab00;">
          <p style="margin:0;font-size:14px;color:#7c5800;">Este link expira em <strong>1 hora</strong>.</p>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:28px;">
      <tr>
        <td style="background:#f8f9fa;border-radius:8px;padding:20px;">
          <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#202124;text-transform:uppercase;letter-spacing:0.5px;">Dicas de segurança</p>
          <ul style="margin:0;padding:0 0 0 18px;color:#5f6368;font-size:14px;line-height:1.8;">
            <li>Use uma senha com pelo menos 8 caracteres</li>
            <li>Inclua letras maiúsculas, minúsculas e números</li>
            <li>Não compartilhe sua senha com ninguém</li>
          </ul>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:28px;">
      <tr>
        <td style="background:#fce8e6;border-radius:8px;padding:14px 20px;border-left:3px solid #d93025;">
          <p style="margin:0;font-size:13px;color:#c5221f;">Se você <strong>não solicitou</strong> esta redefinição, ignore este e-mail. Sua conta permanece segura.</p>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:13px;color:#80868b;text-align:center;">Precisa de ajuda? Entre em contato com o suporte.</p>
  `;
  return emailWrapper(content, '#1a73e8');
}

export function getPasswordChangedEmailTemplate(nome: string): string {
  const content = `
    <h2 style="margin:0 0 4px;font-size:22px;font-weight:600;color:#202124;">Senha alterada com sucesso</h2>
    <p style="margin:0 0 28px;font-size:14px;color:#5f6368;">Sua nova senha está ativa.</p>

    <p style="margin:0 0 24px;font-size:15px;color:#202124;line-height:1.6;">
      Olá, <strong>${nome}</strong>! A senha da sua conta na <strong>Direito &amp; Provento</strong> foi alterada com sucesso.
    </p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:24px;">
      <tr>
        <td style="background:#f8f9fa;border-radius:8px;padding:20px;">
          <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#202124;">Data e hora da alteração</p>
          <p style="margin:0;font-size:14px;color:#5f6368;">${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>
        </td>
      </tr>
    </table>

    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto 24px;">
      <tr>
        <td style="border-radius:4px;background:#1a73e8;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/loginpage"
             style="display:inline-block;padding:12px 32px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:4px;">
            Acessar o sistema
          </a>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:28px;">
      <tr>
        <td style="background:#fce8e6;border-radius:8px;padding:14px 20px;border-left:3px solid #d93025;">
          <p style="margin:0;font-size:13px;color:#c5221f;">Se você <strong>não realizou</strong> esta alteração, entre em contato imediatamente com o suporte.</p>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:13px;color:#80868b;text-align:center;">Dúvidas? Entre em contato com o suporte.</p>
  `;
  return emailWrapper(content, '#1e8e3e');
}
