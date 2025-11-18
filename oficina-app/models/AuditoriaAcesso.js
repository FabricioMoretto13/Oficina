const mongoose = require('mongoose');

const AuditoriaAcessoSchema = new mongoose.Schema({
  usuarioEmail: { type: String, required: true },
  tipoAcesso: { type: String, enum: ['leitura', 'criacao', 'edicao', 'exclusao'], required: true },
  recurso: { type: String, enum: ['cliente', 'veiculo', 'os', 'checklist'], required: true },
  recursoId: { type: String, required: true },
  dadosAcessados: { type: [String], default: [] }, // campos acessados: cpf, email, telefone, etc
  ipAddress: { type: String },
  userAgent: { type: String },
  filial: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

// Index para consultas rápidas
AuditoriaAcessoSchema.index({ usuarioEmail: 1, timestamp: -1 });
AuditoriaAcessoSchema.index({ recursoId: 1, timestamp: -1 });

module.exports = mongoose.model('AuditoriaAcesso', AuditoriaAcessoSchema);
