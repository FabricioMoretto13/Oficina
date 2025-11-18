const express = require('express');
const router = express.Router();
const Cliente = require('../models/Cliente');
const Veiculo = require('../models/Veiculo');
const OrdemServico = require('../models/OrdemServico');
const Checklist = require('../models/Checklist');
const ConsentimentoLGPD = require('../models/ConsentimentoLGPD');
const AuditoriaAcesso = require('../models/AuditoriaAcesso');
const { registrarAuditoria } = require('../utils/auditoria');

/**
 * POST /api/lgpd/solicitar-exclusao
 * Cliente solicita exclusão completa dos dados (direito ao esquecimento)
 */
router.post('/solicitar-exclusao', async (req, res) => {
  try {
    const { cpf, email, motivo } = req.body;

    if (!cpf && !email) {
      return res.status(400).json({ message: 'CPF ou email é obrigatório' });
    }

    // Busca cliente
    const cliente = await Cliente.findOne({ $or: [{ cpf }, { email }] });
    
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }

    // Verifica se há OSs abertas
    const osAbertas = await OrdemServico.countDocuments({ 
      clienteId: cliente._id, 
      status: { $ne: 'encerrada' } 
    });

    if (osAbertas > 0) {
      return res.status(400).json({ 
        message: 'Não é possível excluir dados com ordens de serviço em aberto. Aguarde a finalização.' 
      });
    }

    // Registra auditoria
    await registrarAuditoria(req, 'exclusao', 'cliente', cliente._id, ['exclusao_total']);

    // EXCLUSÃO EM CASCATA
    // 1. Exclui checklists
    await Checklist.deleteMany({ osId: { $in: await OrdemServico.find({ clienteId: cliente._id }).distinct('_id') } });
    
    // 2. Exclui ordens de serviço
    await OrdemServico.deleteMany({ clienteId: cliente._id });
    
    // 3. Exclui veículos
    await Veiculo.deleteMany({ clienteId: cliente._id });
    
    // 4. Marca consentimentos como revogados
    await ConsentimentoLGPD.updateMany(
      { clienteId: cliente._id },
      { revogado: true, dataRevogacao: new Date() }
    );
    
    // 5. Exclui o cliente
    await Cliente.deleteOne({ _id: cliente._id });

    res.json({ 
      message: 'Dados excluídos com sucesso conforme LGPD',
      exclusoes: {
        cliente: 1,
        veiculos: true,
        ordensServico: true,
        checklists: true
      }
    });
  } catch (err) {
    console.error('Erro ao excluir dados LGPD:', err);
    res.status(500).json({ message: 'Erro ao processar exclusão' });
  }
});

/**
 * POST /api/lgpd/consentimento
 * Registra consentimento do cliente
 */
router.post('/consentimento', async (req, res) => {
  try {
    const { 
      clienteId, 
      cpf, 
      nomeCliente, 
      consentimentoColetaDados,
      consentimentoCompartilhamento,
      consentimentoMarketing,
      filial 
    } = req.body;

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const consentimento = await ConsentimentoLGPD.create({
      clienteId,
      cpf,
      nomeCliente,
      consentimentoColetaDados,
      consentimentoCompartilhamento,
      consentimentoMarketing,
      ipAddress,
      userAgent,
      versaoTermos: '1.0',
      filial,
      dataConsentimento: new Date()
    });

    res.json({ message: 'Consentimento registrado', consentimento });
  } catch (err) {
    console.error('Erro ao registrar consentimento:', err);
    res.status(500).json({ message: 'Erro ao registrar consentimento' });
  }
});

/**
 * GET /api/lgpd/meus-dados/:cpf
 * Cliente acessa seus próprios dados (portabilidade)
 */
router.get('/meus-dados/:cpf', async (req, res) => {
  try {
    const { cpf } = req.params;

    const cliente = await Cliente.findOne({ cpf });
    
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }

    // Busca dados relacionados
    const veiculos = await Veiculo.find({ clienteId: cliente._id });
    const ordensServico = await OrdemServico.find({ clienteId: cliente._id });
    const consentimentos = await ConsentimentoLGPD.find({ clienteId: cliente._id });

    // Registra auditoria
    await registrarAuditoria(req, 'leitura', 'cliente', cliente._id, ['portabilidade_dados']);

    res.json({
      cliente: {
        nome: cliente.nome,
        email: cliente.email,
        telefone: cliente.telefone,
        cpf: cliente.getDecryptedCPF ? cliente.getDecryptedCPF() : cliente.cpf,
        dataNascimento: cliente.dataNascimento,
        endereco: cliente.endereco,
        filial: cliente.filial,
        criadoEm: cliente.criadoEm
      },
      veiculos: veiculos.map(v => ({
        placa: v.placa,
        modelo: v.modelo,
        marca: v.marca,
        ano: v.ano
      })),
      ordensServico: ordensServico.map(os => ({
        numero: os.numero,
        descricao: os.descricao,
        status: os.status,
        valor: os.valor,
        dataCriacao: os.dataCriacao
      })),
      consentimentos: consentimentos.map(c => ({
        dataConsentimento: c.dataConsentimento,
        versaoTermos: c.versaoTermos,
        revogado: c.revogado
      }))
    });
  } catch (err) {
    console.error('Erro ao buscar dados:', err);
    res.status(500).json({ message: 'Erro ao buscar dados' });
  }
});

/**
 * GET /api/lgpd/auditoria/:recurso/:id
 * Admin consulta auditoria de um recurso
 */
router.get('/auditoria/:recurso/:id', async (req, res) => {
  try {
    const { recurso, id } = req.params;

    const logs = await AuditoriaAcesso.find({ recurso, recursoId: id })
      .sort({ timestamp: -1 })
      .limit(100);

    res.json({ logs });
  } catch (err) {
    console.error('Erro ao buscar auditoria:', err);
    res.status(500).json({ message: 'Erro ao buscar auditoria' });
  }
});

module.exports = router;
