const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/encryption');

const ClienteSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  email: { type: String },
  telefone: { type: String },
  cpf: { type: String, required: true, unique: true }, // Será armazenado criptografado
  cpfHash: { type: String }, // Hash para buscas
  dataNascimento: { type: Date },
  endereco: { type: String },
  filial: { type: String, required: true },
  consentimentoLGPD: { type: Boolean, default: false },
  dataConsentimento: { type: Date },
  criadoEm: { type: Date, default: Date.now }
});

// Middleware para criptografar CPF antes de salvar
ClienteSchema.pre('save', function(next) {
  if (this.isModified('cpf') && this.cpf) {
    // Salva CPF limpo
    const cpfLimpo = this.cpf.replace(/\D/g, '');
    
    // Cria hash do CPF original para buscas
    const crypto = require('crypto');
    this.cpfHash = crypto.createHash('sha256').update(cpfLimpo).digest('hex');
    
    // Criptografa o CPF
    this.cpf = encrypt(cpfLimpo);
  }
  next();
});

// Método para descriptografar CPF ao recuperar
ClienteSchema.methods.getDecryptedCPF = function() {
  return decrypt(this.cpf);
};

// Método para retornar dados sem informações sensíveis
ClienteSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  obj.cpf = '***.***.***-**'; // Mascara o CPF
  return obj;
};

module.exports = mongoose.model('Cliente', ClienteSchema);
