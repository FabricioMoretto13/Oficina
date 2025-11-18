// utils/whatsappSender.js
// Envia checklist por WhatsApp usando UltraMsg API
const axios = require('axios');

const ULTRAMSG_INSTANCE_ID = process.env.ULTRAMSG_INSTANCE_ID;
const ULTRAMSG_TOKEN = process.env.ULTRAMSG_TOKEN;
const ULTRAMSG_API_URL = 'https://api.ultramsg.com/' + ULTRAMSG_INSTANCE_ID + '/messages';

/**
 * Envia mensagem de checklist para o cliente via WhatsApp
 * @param {string} phone - Telefone do cliente (com DDI, ex: 5511999999999)
 * @param {string} checklistText - Texto do checklist
 * @param {string[]} imageUrls - URLs das imagens do checklist
 * @returns {Promise}
 */
async function sendChecklist(phone, checklistText, imageUrls = []) {
  // Validação das credenciais
  if (!ULTRAMSG_INSTANCE_ID || !ULTRAMSG_TOKEN) {
    throw new Error('WhatsApp não configurado. Configure ULTRAMSG_INSTANCE_ID e ULTRAMSG_TOKEN no arquivo .env');
  }

  // Valida formato do telefone
  const phoneClean = phone.replace(/\D/g, '');
  if (phoneClean.length < 10) {
    throw new Error('Número de telefone inválido');
  }

  // Adiciona DDI 55 se não tiver
  const phoneWithDDI = phoneClean.startsWith('55') ? phoneClean : '55' + phoneClean;

  try {
    // Envia texto
    await axios.post(ULTRAMSG_API_URL, {
      token: ULTRAMSG_TOKEN,
      to: phoneWithDDI,
      body: checklistText,
      priority: 10,
      referenceId: 'checklist_' + Date.now(),
    });
    
    // Envia imagens
    for (const url of imageUrls) {
      // Converte URL relativa em absoluta
      const absoluteUrl = url.startsWith('http') ? url : `${process.env.APP_URL || 'http://localhost:4000'}${url}`;
      await axios.post(ULTRAMSG_API_URL, {
        token: ULTRAMSG_TOKEN,
        to: phoneWithDDI,
        image: absoluteUrl,
        priority: 10,
        referenceId: 'checklist_img_' + Date.now(),
      });
    }
  } catch (error) {
    console.error('Erro ao enviar WhatsApp:', error.response?.data || error.message);
    throw new Error('Erro ao enviar mensagem WhatsApp: ' + (error.response?.data?.error || error.message));
  }
}

module.exports = { sendChecklist };