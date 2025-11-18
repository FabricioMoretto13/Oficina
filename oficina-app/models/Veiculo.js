const mongoose = require('mongoose');

const VeiculoSchema = new mongoose.Schema({
  clienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', required: true },
  placa: { type: String, required: true },
  montadora: { type: String },
  modelo: { type: String },
  ano: { type: Number },
  combustivel: { type: String, enum: ['Alcool', 'Diesel', 'Flex', 'Gasolina', 'GNV'] },
  cor: { type: String },
  chassi: { type: String },
  kmAtual: { type: Number },
  filial: { type: String, required: true },
  criadoEm: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Veiculo', VeiculoSchema);
