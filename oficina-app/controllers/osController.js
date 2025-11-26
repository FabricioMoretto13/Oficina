const Cliente = require('../models/Cliente');
const Veiculo = require('../models/Veiculo');
const Checklist = require('../models/Checklist');
const { enviarEmailChecklist } = require('../utils/emailService');
const { gerarTermoAceitePDF } = require('../utils/termoAceiteGenerator');
const fs = require('fs');

// Get total unique vehicles attended in a given month
exports.totalVeiculosAtendidos = async (req, res) => {
  try {
    if (!req.query.month || !req.query.year) {
      return res.status(400).json({ error: 'month and year are required' });
    }
    const month = parseInt(req.query.month, 10) - 1;
    const year = parseInt(req.query.year, 10);
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 1);
    
    const filter = { criadoEm: { $gte: start, $lt: end } };
    if (req.query.filial) filter.filial = req.query.filial;
    
    const osList = await OrdemServico.find(filter, 'veiculoId');
    const uniqueVeiculos = new Set(osList.map(os => String(os.veiculoId)));
    res.json({ total: uniqueVeiculos.size });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const OrdemServico = require('../models/OrdemServico');

exports.create = async (req, res) => {
  try {
    // Gera número sequencial
    const last = await OrdemServico.findOne({}, {}, { sort: { numero: -1 } });
    const nextNumero = last && last.numero ? last.numero + 1 : 1;
    const os = new OrdemServico({ ...req.body, numero: nextNumero, filial: req.body.filial });
    await os.save();
    res.status(201).json(os);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.list = async (req, res) => {
  try {
    const filter = {};
    if (req.query.clienteId && req.query.clienteId !== 'undefined') filter.clienteId = req.query.clienteId;
    if (req.query.veiculoId && req.query.veiculoId !== 'undefined') filter.veiculoId = req.query.veiculoId;
    if (req.query.filial) filter.filial = req.query.filial;
    if (req.query.status) filter.status = req.query.status;

    // Date range filter (dataInicial and dataFinal)
    if (req.query.dataInicial || req.query.dataFinal) {
      filter.criadoEm = {};
      if (req.query.dataInicial) {
        const dataInicial = new Date(req.query.dataInicial);
        dataInicial.setHours(0, 0, 0, 0);
        filter.criadoEm.$gte = dataInicial;
      }
      if (req.query.dataFinal) {
        const dataFinal = new Date(req.query.dataFinal);
        dataFinal.setHours(23, 59, 59, 999);
        filter.criadoEm.$lte = dataFinal;
      }
    }
    // Month/year filter (fallback for dashboard)
    else if (req.query.month && req.query.year) {
      const month = parseInt(req.query.month, 10) - 1; // JS months are 0-based
      const year = parseInt(req.query.year, 10);
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 1);
      filter.criadoEm = { $gte: start, $lt: end };
    }

    const list = await OrdemServico.find(filter).populate('clienteId').populate('veiculoId').limit(200);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const os = await OrdemServico.findById(req.params.id)
      .populate('clienteId')
      .populate('veiculoId');
    if (!os) return res.status(404).json({ error: 'Ordem de serviço não encontrada' });
    res.json(os);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { descricao } = req.body;
    const os = await OrdemServico.findById(req.params.id);
    if (!os) return res.status(404).json({ error: 'Ordem de serviço não encontrada' });
    if (os.status === 'encerrada') {
      return res.status(400).json({ error: 'Não é possível editar uma OS encerrada' });
    }
    
    if (descricao !== undefined) os.descricao = descricao;
    
    await os.save();
    const updated = await OrdemServico.findById(os._id)
      .populate('clienteId')
      .populate('veiculoId');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.close = async (req, res) => {
  try {
    const id = req.params.id;
    const { entregaValidacao, statusPagamento } = req.body;
    const os = await OrdemServico.findById(id);
    if (!os) return res.status(404).json({ error: 'Ordem de serviço não encontrada' });
    if (os.encerradoEm) return res.status(400).json({ error: 'Ordem já encerrada' });

    // Se o pagamento está pago, encerra a OS
    // Se está pendente, apenas marca como pagamento pendente
    if (statusPagamento === 'pago') {
      os.status = 'encerrada';
      os.encerradoEm = new Date();
    } else {
      os.status = 'pagamento-pendente';
    }
    
    os.statusPagamento = statusPagamento || 'pendente';
    
    if (entregaValidacao) {
      os.entregaValidacao = entregaValidacao;
    }
    await os.save();
    res.json(os);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.enviarEmail = async (req, res) => {
  try {
    const osId = req.params.id;
    const { incluirTermo } = req.body; // Opcional: incluir termo de aceite como anexo
    
    // Busca a OS com dados populados
    const os = await OrdemServico.findById(osId)
      .populate('clienteId')
      .populate('veiculoId');
    
    if (!os) {
      return res.status(404).json({ error: 'Ordem de serviço não encontrada' });
    }

    const cliente = os.clienteId;
    const veiculo = os.veiculoId;

    if (!cliente) {
      return res.status(400).json({ error: 'Cliente não encontrado para esta OS' });
    }

    if (!cliente.email) {
      return res.status(400).json({ error: 'Cliente não possui e-mail cadastrado' });
    }

    // Busca checklists da OS
    const checklists = await Checklist.find({ osId: osId });
    
    if (!checklists || checklists.length === 0) {
      return res.status(400).json({ error: 'Esta OS não possui checklists para enviar' });
    }

    let termoPdfPath = null;

    // Gera o termo de aceite em PDF se solicitado
    if (incluirTermo !== false) { // Por padrão inclui o termo
      try {
        termoPdfPath = await gerarTermoAceitePDF(os, cliente, veiculo, checklists);
      } catch (pdfError) {
        console.error('Erro ao gerar PDF do termo:', pdfError);
        // Continua sem o PDF se houver erro
      }
    }

    // Envia o e-mail
    await enviarEmailChecklist(os, cliente, veiculo, checklists, termoPdfPath);

    // Remove o PDF temporário após envio
    if (termoPdfPath && fs.existsSync(termoPdfPath)) {
      try {
        fs.unlinkSync(termoPdfPath);
      } catch (unlinkError) {
        console.error('Erro ao remover PDF temporário:', unlinkError);
      }
    }

    res.json({ 
      success: true, 
      message: `E-mail enviado com sucesso para ${cliente.email}` 
    });

  } catch (err) {
    console.error('Erro ao enviar e-mail:', err);
    res.status(500).json({ error: err.message || 'Erro ao enviar e-mail' });
  }
};

exports.reopen = async (req, res) => {
  try {
    const id = req.params.id;
    const os = await OrdemServico.findById(id);
    if (!os) return res.status(404).json({ error: 'Ordem de serviço não encontrada' });
    
    if (os.status !== 'encerrada') {
      return res.status(400).json({ error: 'Apenas ordens encerradas podem ser reabertas' });
    }

    os.status = 'reaberta';
    os.encerradoEm = null;
    os.statusPagamento = 'pendente';
    
    await os.save();
    
    const updated = await OrdemServico.findById(os._id)
      .populate('clienteId')
      .populate('veiculoId');
    
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
