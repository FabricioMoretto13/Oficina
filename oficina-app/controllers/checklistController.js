const Checklist = require('../models/Checklist');
const { initFirebaseAdmin } = require('../utils/firebaseAdmin');

const { sendChecklist } = require('../utils/whatsappSender');

exports.create = async (req, res) => {
  try {
    // support both JSON body (no files) and multipart/form-data (files uploaded by multer)
    let payload = req.body || {};

    // when multer is used, req.body.items may be a JSON string
    if (payload.items && typeof payload.items === 'string') {
      try { payload.items = JSON.parse(payload.items) } catch (e) { /* ignore */ }
    }

    const files = req.files || [];

    // build a map of original filename -> saved URL (absolute to this host)
    const fileMap = {}
    const hostPrefix = req ? `${req.protocol}://${req.get('host')}` : ''
    files.forEach(f => {
      // expose via /uploads/<filename> as absolute URL
      fileMap[f.originalname] = `${hostPrefix}/uploads/${f.filename}`;
    });

    const filial = payload.filial;
    const itens = (payload.items || payload.itens || []).map(it => {
      const fotos = (it.fotos || []).map(name => fileMap[name] || name).filter(Boolean);
      return { nome: it.nome, ok: it.ok, observacao: it.observacao, fotos };
    });

    // Parse verificacoesAdicionais se for string
    let verificacoesAdicionais = payload.verificacoesAdicionais;
    if (verificacoesAdicionais && typeof verificacoesAdicionais === 'string') {
      try { verificacoesAdicionais = JSON.parse(verificacoesAdicionais) } catch (e) { /* ignore */ }
    }

    const checklist = new Checklist({ 
      osId: payload.osId || payload.osid || payload.os, 
      itens, 
      filial,
      verificacoesAdicionais: verificacoesAdicionais || {}
    });
    await checklist.save();
    res.status(201).json(checklist);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.list = async (req, res) => {
  try {
    const filter = {};
    if (req.query.osId) filter.osId = req.query.osId;
    if (req.query.filial) filter.filial = req.query.filial;
    const items = await Checklist.find(filter).limit(200);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a checklist and its associated photos from Firebase Storage (if configured)
exports.delete = async (req, res) => {
  try {
    const checklist = await Checklist.findById(req.params.id);
    if (!checklist) return res.status(404).json({ error: 'Checklist not found' });

    // delete any local uploaded files referenced by the checklist
    const urls = [];
    checklist.itens.forEach(it => {
      if (Array.isArray(it.fotos)) urls.push(...it.fotos.filter(Boolean));
    });

    const path = require('path');
    const fs = require('fs');
    urls.forEach(u => {
      try {
        if (typeof u === 'string' && u.includes('/uploads/')) {
          // support absolute URLs (http://host/uploads/filename) or relative (/uploads/filename)
          const parts = u.split('/uploads/')
          const fname = parts[parts.length - 1]
          const p = path.join(__dirname, '..', 'uploads', fname)
          if (fs.existsSync(p)) fs.unlinkSync(p)
        }
      } catch (err) {
        console.error('Failed to delete file', u, err.message || err)
      }
    })

    await Checklist.findByIdAndDelete(req.params.id);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a single item within a checklist and remove its photos from storage
exports.deleteItem = async (req, res) => {
  try {
    const { checklistId, itemId } = req.params;
    const checklist = await Checklist.findById(checklistId);
    if (!checklist) return res.status(404).json({ error: 'Checklist not found' });

    const item = checklist.itens.id(itemId);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const urls = Array.isArray(item.fotos) ? item.fotos.filter(Boolean) : [];
    const path = require('path');
    const fs = require('fs');
    urls.forEach(u => {
      try {
        if (typeof u === 'string' && u.includes('/uploads/')) {
          const parts = u.split('/uploads/')
          const fname = parts[parts.length - 1]
          const p = path.join(__dirname, '..', 'uploads', fname)
          if (fs.existsSync(p)) fs.unlinkSync(p)
        }
      } catch (err) {
        console.error('Failed to delete file', u, err.message || err)
      }
    })

    // remove the item and save
    item.remove();
    await checklist.save();
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Envia checklist por WhatsApp
exports.sendWhatsappChecklist = async (req, res) => {
  try {
    const { checklistId, phone } = req.body;
    if (!checklistId || !phone) return res.status(400).json({ error: 'checklistId e phone são obrigatórios' });
    const checklist = await Checklist.findById(checklistId);
    if (!checklist) return res.status(404).json({ error: 'Checklist não encontrado' });

    // Monta texto do checklist
    let checklistText = `Checklist OS: ${checklist.osId}\nFilial: ${checklist.filial}\n`;
    checklist.itens.forEach((item, idx) => {
      checklistText += `\n${idx + 1}. ${item.nome} - ${item.ok ? 'OK' : 'NÃO OK'}\nObs: ${item.observacao || ''}`;
    });
    // Coleta URLs das imagens
    const imageUrls = [];
    checklist.itens.forEach(item => {
      if (Array.isArray(item.fotos)) imageUrls.push(...item.fotos.filter(Boolean));
    });

    await sendChecklist(phone, checklistText, imageUrls);
    res.json({ sent: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
