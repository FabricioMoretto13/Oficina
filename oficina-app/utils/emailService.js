const nodemailer = require('nodemailer');

// Configuração do transporte de e-mail
// Por padrão usa Gmail, mas pode ser configurado para outros provedores
function createTransporter() {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
}

// Template HTML para o e-mail de checklist
function gerarEmailChecklistHTML(os, cliente, veiculo, checklists) {
  const checklist = checklists[0];
  
  let itensHTML = '';
  if (checklist && checklist.itens) {
    checklist.itens.forEach((item, idx) => {
      const statusIcon = item.ok ? '✅' : '❌';
      const statusColor = item.ok ? '#4caf50' : '#f44336';
      
      itensHTML += `
        <tr style="border-bottom: 1px solid #e0e0e0;">
          <td style="padding: 12px 8px;">
            <span style="font-size: 20px;">${statusIcon}</span>
          </td>
          <td style="padding: 12px 8px;">
            <strong>${item.nome}</strong>
            ${item.observacao ? `<br><span style="color: #666; font-size: 14px;">Obs: ${item.observacao}</span>` : ''}
          </td>
        </tr>
      `;
    });
  }

  // Verificações adicionais
  let verificacoesHTML = '';
  if (checklist && checklist.verificacoesAdicionais) {
    const va = checklist.verificacoesAdicionais;
    
    if (va.possuiVazamento) {
      const temVazamento = va.possuiVazamento === 'sim';
      verificacoesHTML += `
        <div style="background: ${temVazamento ? '#ffebee' : '#e8f5e9'}; padding: 12px; border-radius: 6px; margin-bottom: 10px;">
          <strong style="color: ${temVazamento ? '#c62828' : '#2e7d32'};">
            ${temVazamento ? '⚠️' : '✅'} Vazamento: ${temVazamento ? 'SIM' : 'NÃO'}
          </strong>
          ${temVazamento && va.vazamentoDetalhes ? `
            <div style="margin-top: 8px; font-size: 14px; color: #555;">
              Tipos: ${[
                va.vazamentoDetalhes.arCondicionado && 'Ar Condicionado',
                va.vazamentoDetalhes.cambio && 'Câmbio',
                va.vazamentoDetalhes.direcao && 'Direção',
                va.vazamentoDetalhes.freio && 'Freio',
                va.vazamentoDetalhes.motor && 'Motor',
                va.vazamentoDetalhes.radiador && 'Radiador',
                va.vazamentoDetalhes.suspensao && 'Suspensão'
              ].filter(Boolean).join(', ')}
            </div>
          ` : ''}
        </div>
      `;
    }

    if (va.luzesManutencao) {
      const temLuzes = va.luzesManutencao === 'sim';
      verificacoesHTML += `
        <div style="background: ${temLuzes ? '#ffebee' : '#e8f5e9'}; padding: 12px; border-radius: 6px; margin-bottom: 10px;">
          <strong style="color: ${temLuzes ? '#c62828' : '#2e7d32'};">
            ${temLuzes ? '⚠️' : '✅'} Luzes no Painel: ${temLuzes ? 'SIM' : 'NÃO'}
          </strong>
          ${temLuzes && va.luzesDetalhes ? `
            <div style="margin-top: 8px; font-size: 14px; color: #555;">
              Luzes: ${[
                va.luzesDetalhes.abs && 'ABS',
                va.luzesDetalhes.airbag && 'Airbag',
                va.luzesDetalhes.bateria && 'Bateria',
                va.luzesDetalhes.combustivel && 'Combustível',
                va.luzesDetalhes.epc && 'EPC',
                va.luzesDetalhes.esc && 'ESC',
                va.luzesDetalhes.freio && 'Freio',
                va.luzesDetalhes.injecao && 'Injeção',
                va.luzesDetalhes.motor && 'Motor',
                va.luzesDetalhes.oleo && 'Óleo',
                va.luzesDetalhes.pressaoPneus && 'Pressão dos Pneus',
                va.luzesDetalhes.temperatura && 'Temperatura',
                va.luzesDetalhes.outros && (va.luzesOutrosTexto ? `Outros (${va.luzesOutrosTexto})` : 'Outros')
              ].filter(Boolean).join(', ')}
            </div>
          ` : ''}
        </div>
      `;
    }
  }

  // Validação de entrega
  let entregaHTML = '';
  if (os.entregaValidacao && os.entregaValidacao.checks) {
    entregaHTML = `
      <div style="margin-top: 30px; padding: 20px; background: #f5f5f5; border-radius: 8px;">
        <h3 style="color: #333; margin-top: 0;">Validação de Entrega do Veículo</h3>
        <table style="width: 100%; border-collapse: collapse;">
    `;
    
    os.entregaValidacao.checks.forEach(check => {
      const statusIcon = check.checked ? '✅' : '❌';
      entregaHTML += `
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 8px;"><span style="font-size: 18px;">${statusIcon}</span></td>
          <td style="padding: 8px;">${check.label}</td>
        </tr>
      `;
    });
    
    entregaHTML += `
        </table>
        <p style="margin-top: 15px; color: #555;">
          <strong>Funcionário responsável:</strong> ${os.entregaValidacao.funcionario || 'Não informado'}
        </p>
      </div>
    `;
  }

  // Status de pagamento
  let pagamentoHTML = '';
  if (os.status === 'encerrada' || os.status === 'pagamento-pendente') {
    const isPago = os.statusPagamento === 'pago';
    pagamentoHTML = `
      <div style="margin-top: 20px; padding: 15px; background: ${isPago ? '#e8f5e9' : '#fff3cd'}; border-radius: 8px; border: 2px solid ${isPago ? '#4caf50' : '#ffc107'};">
        <h3 style="color: ${isPago ? '#2e7d32' : '#856404'}; margin-top: 0;">Status do Pagamento</h3>
        <p style="font-size: 18px; font-weight: bold; color: ${isPago ? '#2e7d32' : '#856404'};">
          ${isPago ? '✅ PAGO - Serviço Quitado' : '⚠️ PENDENTE - Aguardando Pagamento'}
        </p>
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Checklist de Vistoria - Alien Engine Tunning</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">ALIEN ENGINE TUNNING</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">Checklist de Vistoria</p>
      </div>
      
      <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h2 style="color: #667eea; margin-top: 0; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Informações da Ordem de Serviço</h2>
          <p style="margin: 10px 0;"><strong>OS #:</strong> ${os.numero || os._id.slice(-6).toUpperCase()}</p>
          <p style="margin: 10px 0;"><strong>Cliente:</strong> ${cliente.nome}</p>
          <p style="margin: 10px 0;"><strong>Veículo:</strong> ${veiculo?.placa || ''} - ${veiculo?.montadora || ''} ${veiculo?.modelo || ''}</p>
          <p style="margin: 10px 0;"><strong>Data:</strong> ${checklist ? new Date(checklist.criadoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</p>
          ${os.descricao ? `<p style="margin: 10px 0;"><strong>Serviços Realizados:</strong> ${os.descricao}</p>` : ''}
        </div>

        <h2 style="color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Itens Verificados</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          ${itensHTML}
        </table>

        ${verificacoesHTML ? `
          <h2 style="color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px; margin-top: 30px;">Verificações Adicionais</h2>
          ${verificacoesHTML}
        ` : ''}

        ${entregaHTML}
        
        ${pagamentoHTML}

        <div style="margin-top: 40px; padding: 20px; background: #f0f0f0; border-radius: 8px; text-align: center;">
          <p style="margin: 0; color: #666; font-size: 14px;">
            Qualquer dúvida, estamos à disposição!<br>
            <strong>Alien Engine Tunning</strong>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Função para enviar e-mail com checklist
async function enviarEmailChecklist(os, cliente, veiculo, checklists, termoPdfPath = null) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    throw new Error('Configurações de e-mail não encontradas. Configure EMAIL_USER e EMAIL_PASSWORD no arquivo .env');
  }

  if (!cliente.email) {
    throw new Error('Cliente não possui e-mail cadastrado');
  }

  const transporter = createTransporter();
  const htmlContent = gerarEmailChecklistHTML(os, cliente, veiculo, checklists);

  const mailOptions = {
    from: `"Alien Engine Tunning" <${process.env.EMAIL_USER}>`,
    to: cliente.email,
    subject: `Checklist de Vistoria - OS #${os.numero || os._id.slice(-6).toUpperCase()}`,
    html: htmlContent,
    attachments: []
  };

  // Adiciona o termo de aceite como anexo se fornecido
  if (termoPdfPath) {
    mailOptions.attachments.push({
      filename: `Termo_Aceite_OS_${os.numero || os._id.slice(-6).toUpperCase()}.pdf`,
      path: termoPdfPath
    });
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('E-mail enviado com sucesso:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    throw new Error(`Falha ao enviar e-mail: ${error.message}`);
  }
}

module.exports = {
  enviarEmailChecklist,
  gerarEmailChecklistHTML
};
