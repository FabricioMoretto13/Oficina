const AuditoriaAcesso = require('../models/AuditoriaAcesso');

/**
 * Middleware para registrar acessos a dados pessoais (LGPD Art. 37)
 */
async function registrarAuditoria(req, tipoAcesso, recurso, recursoId, dadosAcessados = []) {
  try {
    const usuarioEmail = req.headers['x-user-email'] || 'sistema';
    const filial = req.body.filial || req.query.filial || 'desconhecido';
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    await AuditoriaAcesso.create({
      usuarioEmail,
      tipoAcesso,
      recurso,
      recursoId: recursoId.toString(),
      dadosAcessados,
      ipAddress,
      userAgent,
      filial,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Erro ao registrar auditoria:', error);
    // Não bloqueia a operação principal se auditoria falhar
  }
}

/**
 * Middleware express para auditoria automática
 */
function auditoriaMiddleware(recurso) {
  return async (req, res, next) => {
    // Salva a função original de send
    const originalSend = res.send;
    
    res.send = function(data) {
      // Determina tipo de acesso baseado no método HTTP
      let tipoAcesso = 'leitura';
      if (req.method === 'POST') tipoAcesso = 'criacao';
      else if (req.method === 'PUT' || req.method === 'PATCH') tipoAcesso = 'edicao';
      else if (req.method === 'DELETE') tipoAcesso = 'exclusao';

      // ID do recurso (pode vir da URL ou corpo da requisição)
      const recursoId = req.params.id || req.body._id || req.body.id || 'novo';

      // Registra auditoria de forma assíncrona
      registrarAuditoria(req, tipoAcesso, recurso, recursoId, []);

      // Chama a função original
      originalSend.call(this, data);
    };

    next();
  };
}

/**
 * Busca logs de auditoria de um recurso específico
 */
async function buscarAuditoriaRecurso(recurso, recursoId, limite = 50) {
  try {
    return await AuditoriaAcesso.find({ recurso, recursoId })
      .sort({ timestamp: -1 })
      .limit(limite)
      .lean();
  } catch (error) {
    console.error('Erro ao buscar auditoria:', error);
    return [];
  }
}

/**
 * Busca logs de auditoria de um usuário
 */
async function buscarAuditoriaUsuario(usuarioEmail, limite = 100) {
  try {
    return await AuditoriaAcesso.find({ usuarioEmail })
      .sort({ timestamp: -1 })
      .limit(limite)
      .lean();
  } catch (error) {
    console.error('Erro ao buscar auditoria:', error);
    return [];
  }
}

module.exports = {
  registrarAuditoria,
  auditoriaMiddleware,
  buscarAuditoriaRecurso,
  buscarAuditoriaUsuario
};
