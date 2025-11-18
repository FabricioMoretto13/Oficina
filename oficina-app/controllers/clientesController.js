const Cliente = require('../models/Cliente');
const crypto = require('crypto');
const { decrypt } = require('../utils/encryption');

exports.create = async (req, res) => {
  try {
    const { cpf, email, filial } = req.body;
    
    // Cria hash do CPF para verificar duplicidade
    const cpfLimpo = cpf ? cpf.replace(/\D/g, '') : '';
    const cpfHash = cpfLimpo ? crypto.createHash('sha256').update(cpfLimpo).digest('hex') : null;
    
    // Verifica se já existe cliente com mesmo CPF ou e-mail na mesma filial
    const filter = { filial };
    if (cpfHash) {
      filter.$or = [{ cpfHash }, { email }];
    } else if (email) {
      filter.email = email;
    }
    
    const exists = await Cliente.findOne(filter);
    if (exists) {
      return res.status(400).json({ error: 'Cliente já cadastrado com este CPF ou e-mail nesta filial.' });
    }
    
    const cliente = new Cliente({ ...req.body, cpf: cpfLimpo, filial });
    await cliente.save();
    
    // Retorna com CPF descriptografado e formatado
    const clienteObj = cliente.toObject();
    try {
      const cpfDescriptografado = decrypt(clienteObj.cpf);
      if (cpfDescriptografado && cpfDescriptografado.length === 11) {
        clienteObj.cpfCnpj = cpfDescriptografado.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      } else if (cpfDescriptografado) {
        clienteObj.cpfCnpj = cpfDescriptografado;
      } else {
        clienteObj.cpfCnpj = '***.***.***-**';
      }
    } catch (err) {
      console.error('Erro ao descriptografar CPF:', err);
      clienteObj.cpfCnpj = '***.***.***-**';
    }
    delete clienteObj.cpf;
    delete clienteObj.cpfHash;
    res.status(201).json(clienteObj);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.list = async (req, res) => {
  try {
    const q = req.query.q;
    const filial = req.query.filial;
    const filter = filial ? { filial } : {};
    
    if (q) {
      const qLimpo = q.trim();
      const qNumeros = qLimpo.replace(/\D/g, '');
      
      // Se a busca contém números (pode ser CPF completo ou parcial)
      if (qNumeros) {
        // Se tem 11 dígitos (CPF completo), busca pelo hash exato
        if (qNumeros.length === 11) {
          const cpfHash = crypto.createHash('sha256').update(qNumeros).digest('hex');
          filter.$or = [
            { nome: new RegExp(qLimpo, 'i') },
            { cpfHash: cpfHash }
          ];
        } else if (qNumeros.length >= 3) {
          // CPF parcial - busca apenas por nome que contenha os números
          filter.nome = new RegExp(qLimpo, 'i');
        } else {
          // Muito curto, busca só por nome
          filter.nome = new RegExp(qLimpo, 'i');
        }
      } else {
        // Busca apenas por nome (texto sem números)
        filter.nome = new RegExp(qLimpo, 'i');
      }
    }
    
    const clientes = await Cliente.find(filter).limit(100);
    
    // Descriptografa CPF antes de retornar
    const clientesComCPF = clientes.map(c => {
      const obj = c.toObject();
      try {
        // O CPF já vem criptografado do banco, vamos descriptografar
        const cpfDescriptografado = decrypt(obj.cpf);
        // Formata o CPF: 123.456.789-01
        if (cpfDescriptografado && cpfDescriptografado.length === 11) {
          obj.cpfCnpj = cpfDescriptografado.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        } else if (cpfDescriptografado) {
          obj.cpfCnpj = cpfDescriptografado;
        } else {
          obj.cpfCnpj = '***.***.***-**';
        }
      } catch (err) {
        console.error('Erro ao descriptografar CPF:', err);
        obj.cpfCnpj = '***.***.***-**'; // Se falhar, mascara
      }
      // Remove o campo cpf criptografado
      delete obj.cpf;
      delete obj.cpfHash;
      return obj;
    });
    
    res.json(clientesComCPF);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Se está atualizando o CPF, processa corretamente
    if (updateData.cpfCnpj) {
      const cpfLimpo = updateData.cpfCnpj.replace(/\D/g, '');
      updateData.cpf = cpfLimpo;
      delete updateData.cpfCnpj;
    }
    
    const cliente = await Cliente.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    
    // Retorna com CPF descriptografado e formatado
    const clienteObj = cliente.toObject();
    try {
      const cpfDescriptografado = decrypt(clienteObj.cpf);
      if (cpfDescriptografado && cpfDescriptografado.length === 11) {
        clienteObj.cpfCnpj = cpfDescriptografado.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      } else if (cpfDescriptografado) {
        clienteObj.cpfCnpj = cpfDescriptografado;
      } else {
        clienteObj.cpfCnpj = '***.***.***-**';
      }
    } catch (err) {
      console.error('Erro ao descriptografar CPF:', err);
      clienteObj.cpfCnpj = '***.***.***-**';
    }
    delete clienteObj.cpf;
    delete clienteObj.cpfHash;
    
    res.json(clienteObj);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
