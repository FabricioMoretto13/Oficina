const mongoose = require('mongoose');

const ConsentimentoLGPDSchema = new mongoose.Schema({
  clienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', required: true },
  cpf: { type: String, required: true },
  nomeCliente: { type: String, required: true },
  consentimentoColetaDados: { type: Boolean, required: true, default: false },
  consentimentoCompartilhamento: { type: Boolean, default: false },
  consentimentoMarketing: { type: Boolean, default: false },
  ipAddress: { type: String },
  userAgent: { type: String },
  versaoTermos: { type: String, default: '1.0' },
  dataConsentimento: { type: Date, default: Date.now },
  revogado: { type: Boolean, default: false },
  dataRevogacao: { type: Date },
  filial: { type: String, required: true }
});

module.exports = mongoose.model('ConsentimentoLGPD', ConsentimentoLGPDSchema);
