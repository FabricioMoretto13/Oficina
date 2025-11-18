const mongoose = require('mongoose');

const UsuarioSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  filial: { type: String, required: true },
  status: { type: String, enum: ['pendente', 'aprovado', 'reprovado'], default: 'pendente' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Usuario', UsuarioSchema);
