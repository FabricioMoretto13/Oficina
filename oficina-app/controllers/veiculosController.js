const Veiculo = require('../models/Veiculo');

exports.create = async (req, res) => {
  try {
    const veiculo = new Veiculo({ ...req.body, filial: req.body.filial });
    await veiculo.save();
    res.status(201).json(veiculo);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.list = async (req, res) => {
  try {
    const q = req.query.q;
    const filial = req.query.filial;
    const filter = filial ? { filial } : {};
    if (q) filter.placa = new RegExp(q, 'i');
    const veiculos = await Veiculo.find(filter).populate('clienteId').limit(200);
    res.json(veiculos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const veiculo = await Veiculo.findByIdAndUpdate(id, req.body, { new: true });
    
    if (!veiculo) {
      return res.status(404).json({ error: 'Veículo não encontrado' });
    }
    
    res.json(veiculo);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
