const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  ok: { type: Boolean, default: false },
  observacao: { type: String }
  ,
  fotos: { type: [String], default: [] }
});

const ChecklistSchema = new mongoose.Schema({
  osId: { type: mongoose.Schema.Types.ObjectId, ref: 'OrdemServico', required: true },
  itens: { type: [ItemSchema], default: [] },
  filial: { type: String, required: true },
  verificacoesAdicionais: {
    possuiVazamento: { type: String, enum: ['sim', 'nao', ''], default: '' },
    vazamentoDetalhes: {
      arCondicionado: { type: Boolean, default: false },
      cambio: { type: Boolean, default: false },
      direcao: { type: Boolean, default: false },
      freio: { type: Boolean, default: false },
      motor: { type: Boolean, default: false },
      radiador: { type: Boolean, default: false },
      suspensao: { type: Boolean, default: false }
    },
    luzesManutencao: { type: String, enum: ['sim', 'nao', ''], default: '' },
    luzesDetalhes: {
      abs: { type: Boolean, default: false },
      airbag: { type: Boolean, default: false },
      bateria: { type: Boolean, default: false },
      combustivel: { type: Boolean, default: false },
      epc: { type: Boolean, default: false },
      esc: { type: Boolean, default: false },
      freio: { type: Boolean, default: false },
      injecao: { type: Boolean, default: false },
      motor: { type: Boolean, default: false },
      oleo: { type: Boolean, default: false },
      pressaoPneus: { type: Boolean, default: false },
      temperatura: { type: Boolean, default: false },
      outros: { type: Boolean, default: false }
    },
    luzesOutrosTexto: { type: String, default: '' }
  },
  criadoEm: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Checklist', ChecklistSchema);
