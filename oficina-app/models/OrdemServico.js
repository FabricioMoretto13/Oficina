const mongoose = require('mongoose');

const OrdemServicoSchema = new mongoose.Schema({
  numero: { type: Number, unique: true },
  clienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', required: true },
  veiculoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Veiculo', required: true },
  descricao: { type: String, required: true, trim: true },
  status: { type: String, default: 'aberta' },
  statusPagamento: { type: String, enum: ['pago', 'pendente'], default: 'pendente' },
  itens: { type: Array, default: [] },
  filial: { type: String, required: true },
  criadoEm: { type: Date, default: Date.now },
  encerradoEm: { type: Date },
  entregaValidacao: {
    checks: { type: Array, default: [] },
    funcionario: { type: String, default: '' }
  }
});

module.exports = mongoose.model('OrdemServico', OrdemServicoSchema);
