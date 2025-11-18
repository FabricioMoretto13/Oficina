const Usuario = require('../models/Usuario');

const ADMIN_EMAIL = 'fabriciomoretto73@gmail.com';

// Salva usuário no banco ao cadastrar
exports.registrarUsuario = async (req, res) => {
  try {
    const { nome, email, filial } = req.body;
    if (!nome || !email || !filial) return res.status(400).json({ error: 'Dados obrigatórios faltando.' });
    const existe = await Usuario.findOne({ email });
    if (existe) return res.status(409).json({ error: 'Usuário já existe.' });
    // Admin tem aprovação automática
    const status = email === ADMIN_EMAIL ? 'aprovado' : 'pendente';
    const usuario = new Usuario({ nome, email, filial, status });
    await usuario.save();
    res.status(201).json({ message: 'Usuário registrado com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao registrar usuário.' });
  }
};

// Valida filial do usuário após login
exports.validarFilial = async (req, res) => {
  try {
    const { email, filial } = req.body;
    if (!email || !filial) return res.status(400).json({ error: 'Dados obrigatórios faltando.' });
    const usuario = await Usuario.findOne({ email });
    if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado.' });
    // Admin tem acesso irrestrito
    if (email === ADMIN_EMAIL) {
      return res.json({ ok: true, isAdmin: true });
    }
    if (usuario.status !== 'aprovado') return res.status(403).json({ error: 'Usuário aguardando aprovação.' });
    if (usuario.filial !== filial) return res.status(403).json({ error: 'Acesso negado à filial.' });
    res.json({ ok: true, isAdmin: false });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao validar filial.' });
  }
};

// Lista todos os usuários
exports.listarUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.find().sort({ createdAt: -1 });
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar usuários.' });
  }
};

// Aprovar ou reprovar usuário
exports.atualizarStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    console.log('Requisição de atualização de status:');
    console.log('ID:', id);
    console.log('Body completo:', req.body);
    console.log('Status recebido:', status);
    console.log('Tipo do status:', typeof status);
    
    if (!status) {
      return res.status(400).json({ error: 'Status não foi informado.' });
    }
    
    if (!['aprovado', 'reprovado', 'pendente'].includes(status)) {
      return res.status(400).json({ error: `Status inválido: "${status}". Valores aceitos: aprovado, reprovado, pendente.` });
    }
    
    const usuario = await Usuario.findById(id);
    if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado.' });
    
    // Impede alteração do status do admin
    if (usuario.email === ADMIN_EMAIL) {
      return res.status(403).json({ error: 'Não é possível alterar o status do administrador.' });
    }
    
    usuario.status = status;
    await usuario.save();
    console.log('Usuário atualizado com sucesso:', usuario);
    res.json(usuario);
  } catch (err) {
    console.error('Erro ao atualizar status:', err);
    res.status(500).json({ error: 'Erro ao atualizar status.' });
  }
};
