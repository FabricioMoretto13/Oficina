const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Gera um PDF do Termo de Aceite e Execução de Serviços
 * @param {Object} os - Ordem de Serviço
 * @param {Object} cliente - Dados do cliente
 * @param {Object} veiculo - Dados do veículo
 * @param {Array} checklists - Array de checklists da OS
 * @returns {Promise<string>} - Caminho do arquivo PDF gerado
 */
async function gerarTermoAceitePDF(os, cliente, veiculo, checklists) {
  return new Promise((resolve, reject) => {
    try {
      // Cria diretório para PDFs se não existir
      const pdfDir = path.join(__dirname, '..', 'uploads', 'termos');
      if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir, { recursive: true });
      }

      const filename = `termo_aceite_${os._id}_${Date.now()}.pdf`;
      const filepath = path.join(pdfDir, filename);
      
      const doc = new PDFDocument({ 
        size: 'A4', 
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: `Termo de Aceite - OS #${os.numero || os._id.slice(-6).toUpperCase()}`,
          Author: 'Alien Engine Tunning'
        }
      });

      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      // Cabeçalho
      doc.fontSize(20)
         .fillColor('#667eea')
         .text('ALIEN ENGINE TUNNING', { align: 'center' });
      
      doc.fontSize(14)
         .fillColor('#333')
         .text('Termo de Aceite e Execução de Serviços', { align: 'center' });
      
      doc.moveDown(2);

      // Informações da OS
      doc.fontSize(16)
         .fillColor('#667eea')
         .text('Dados da Ordem de Serviço', { underline: true });
      
      doc.moveDown(0.5);
      
      doc.fontSize(11)
         .fillColor('#333')
         .text(`OS #: ${os.numero || os._id.slice(-6).toUpperCase()}`)
         .text(`Data de Abertura: ${new Date(os.criadoEm).toLocaleDateString('pt-BR')}`)
         .text(`Status: ${os.status === 'encerrada' ? 'Encerrada' : os.status === 'pagamento-pendente' ? 'Pagamento Pendente' : 'Aberta'}`);
      
      if (os.encerradoEm) {
        doc.text(`Data de Encerramento: ${new Date(os.encerradoEm).toLocaleDateString('pt-BR')}`);
      }

      doc.moveDown(1.5);

      // Dados do Cliente
      doc.fontSize(16)
         .fillColor('#667eea')
         .text('Dados do Cliente', { underline: true });
      
      doc.moveDown(0.5);
      
      doc.fontSize(11)
         .fillColor('#333')
         .text(`Nome: ${cliente.nome}`)
         .text(`CPF/CNPJ: ${cliente.cpf || cliente.cpfCnpj || 'Não informado'}`)
         .text(`Telefone: ${cliente.telefone || 'Não informado'}`)
         .text(`E-mail: ${cliente.email || 'Não informado'}`);

      doc.moveDown(1.5);

      // Dados do Veículo
      doc.fontSize(16)
         .fillColor('#667eea')
         .text('Dados do Veículo', { underline: true });
      
      doc.moveDown(0.5);
      
      doc.fontSize(11)
         .fillColor('#333')
         .text(`Placa: ${veiculo?.placa || 'Não informado'}`)
         .text(`Montadora: ${veiculo?.montadora || 'Não informado'}`)
         .text(`Modelo: ${veiculo?.modelo || 'Não informado'}`)
         .text(`Ano: ${veiculo?.ano || 'Não informado'}`);

      doc.moveDown(1.5);

      // Serviços Realizados
      doc.fontSize(16)
         .fillColor('#667eea')
         .text('Serviços Realizados', { underline: true });
      
      doc.moveDown(0.5);
      
      doc.fontSize(11)
         .fillColor('#333')
         .text(os.descricao || 'Não especificado', { align: 'justify' });

      doc.moveDown(1.5);

      // Checklist de Vistoria
      if (checklists && checklists.length > 0) {
        const checklist = checklists[0];
        
        doc.addPage();
        
        doc.fontSize(16)
           .fillColor('#667eea')
           .text('Checklist de Vistoria', { underline: true });
        
        doc.moveDown(1);

        if (checklist.itens && checklist.itens.length > 0) {
          checklist.itens.forEach((item, idx) => {
            const status = item.ok ? '✓' : '✗';
            const color = item.ok ? '#4caf50' : '#f44336';
            
            doc.fontSize(10)
               .fillColor(color)
               .text(`${status}`, { continued: true })
               .fillColor('#333')
               .text(`  ${item.nome}`);
            
            if (item.observacao) {
              doc.fontSize(9)
                 .fillColor('#666')
                 .text(`   Obs: ${item.observacao}`, { indent: 20 });
            }
            
            doc.moveDown(0.3);
          });
        }

        // Verificações Adicionais
        if (checklist.verificacoesAdicionais) {
          doc.moveDown(1);
          
          doc.fontSize(14)
             .fillColor('#667eea')
             .text('Verificações Adicionais', { underline: true });
          
          doc.moveDown(0.5);

          const va = checklist.verificacoesAdicionais;

          if (va.possuiVazamento) {
            const temVazamento = va.possuiVazamento === 'sim';
            doc.fontSize(10)
               .fillColor(temVazamento ? '#f44336' : '#4caf50')
               .text(`Vazamento: ${temVazamento ? 'SIM ⚠️' : 'NÃO ✓'}`);
            
            if (temVazamento && va.vazamentoDetalhes) {
              const tipos = [
                va.vazamentoDetalhes.arCondicionado && 'Ar Condicionado',
                va.vazamentoDetalhes.cambio && 'Câmbio',
                va.vazamentoDetalhes.direcao && 'Direção',
                va.vazamentoDetalhes.freio && 'Freio',
                va.vazamentoDetalhes.motor && 'Motor',
                va.vazamentoDetalhes.radiador && 'Radiador',
                va.vazamentoDetalhes.suspensao && 'Suspensão'
              ].filter(Boolean);
              
              if (tipos.length > 0) {
                doc.fontSize(9)
                   .fillColor('#666')
                   .text(`   Tipos: ${tipos.join(', ')}`, { indent: 20 });
              }
            }
            
            doc.moveDown(0.5);
          }

          if (va.luzesManutencao) {
            const temLuzes = va.luzesManutencao === 'sim';
            doc.fontSize(10)
               .fillColor(temLuzes ? '#f44336' : '#4caf50')
               .text(`Luzes no Painel: ${temLuzes ? 'SIM ⚠️' : 'NÃO ✓'}`);
            
            if (temLuzes && va.luzesDetalhes) {
              const luzes = [
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
              ].filter(Boolean);
              
              if (luzes.length > 0) {
                doc.fontSize(9)
                   .fillColor('#666')
                   .text(`   Luzes: ${luzes.join(', ')}`, { indent: 20 });
              }
            }
          }
        }
      }

      // Validação de Entrega
      if (os.entregaValidacao && os.entregaValidacao.checks) {
        doc.addPage();
        
        doc.fontSize(16)
           .fillColor('#667eea')
           .text('Validação de Entrega do Veículo', { underline: true });
        
        doc.moveDown(1);

        os.entregaValidacao.checks.forEach(check => {
          const status = check.checked ? '✓' : '✗';
          const color = check.checked ? '#4caf50' : '#f44336';
          
          doc.fontSize(10)
             .fillColor(color)
             .text(`${status}`, { continued: true })
             .fillColor('#333')
             .text(`  ${check.label}`);
          
          doc.moveDown(0.3);
        });

        doc.moveDown(1);
        
        doc.fontSize(11)
           .fillColor('#333')
           .text(`Funcionário Responsável pela Entrega: ${os.entregaValidacao.funcionario || 'Não informado'}`);
      }

      // Status de Pagamento
      if (os.status === 'encerrada' || os.status === 'pagamento-pendente') {
        doc.moveDown(2);
        
        const isPago = os.statusPagamento === 'pago';
        
        doc.fontSize(14)
           .fillColor(isPago ? '#4caf50' : '#f44336')
           .text(`Status do Pagamento: ${isPago ? 'PAGO ✓' : 'PENDENTE ⚠️'}`, { 
             align: 'center',
             underline: true 
           });
      }

      // Termo de Aceite
      doc.addPage();
      
      doc.fontSize(16)
         .fillColor('#667eea')
         .text('TERMO DE ACEITE', { align: 'center', underline: true });
      
      doc.moveDown(1.5);

      doc.fontSize(10)
         .fillColor('#333')
         .text(
           'Declaro que os serviços acima descritos foram realizados de acordo com as especificações acordadas. ' +
           'Confirmo que o veículo foi entregue nas condições descritas no checklist de vistoria e que ' +
           'estou ciente de todas as observações e verificações realizadas.',
           { align: 'justify', lineGap: 5 }
         );

      doc.moveDown(2);

      doc.fontSize(10)
         .text('Recebi o veículo em perfeitas condições de funcionamento e declaro estar satisfeito com os serviços prestados.', {
           align: 'justify',
           lineGap: 5
         });

      doc.moveDown(3);

      // Campos de assinatura
      const pageWidth = doc.page.width;
      const leftMargin = doc.page.margins.left;
      const rightMargin = doc.page.margins.right;
      const usableWidth = pageWidth - leftMargin - rightMargin;
      const signatureWidth = usableWidth / 2 - 20;

      doc.fontSize(10)
         .text('_'.repeat(50), leftMargin, doc.y, { width: signatureWidth, align: 'center' })
         .moveDown(0.3)
         .text('Assinatura do Cliente', leftMargin, doc.y, { width: signatureWidth, align: 'center' });

      doc.fontSize(10)
         .text('_'.repeat(50), leftMargin + signatureWidth + 40, doc.y - 25, { width: signatureWidth, align: 'center' })
         .moveDown(0.3)
         .text('Assinatura da Oficina', leftMargin + signatureWidth + 40, doc.y, { width: signatureWidth, align: 'center' });

      doc.moveDown(2);

      doc.fontSize(9)
         .fillColor('#666')
         .text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, { align: 'center' });

      doc.moveDown(3);

      // Rodapé
      doc.fontSize(8)
         .fillColor('#999')
         .text(
           'Este documento foi gerado eletronicamente pelo sistema Alien Engine Tunning. ' +
           'Para validação, entre em contato conosco.',
           { align: 'center', lineGap: 3 }
         );

      doc.end();

      stream.on('finish', () => {
        resolve(filepath);
      });

      stream.on('error', (err) => {
        reject(err);
      });

    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  gerarTermoAceitePDF
};
