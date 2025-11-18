const crypto = require('crypto');

// Chave de criptografia - EM PRODUÇÃO, USE VARIÁVEL DE AMBIENTE!
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'sua-chave-secreta-de-32-caracteres-aqui-lgpd-2024'; // Deve ter 32 caracteres
const IV_LENGTH = 16; // Para AES, usa 16 bytes

/**
 * Criptografa dados sensíveis usando AES-256-CBC
 * @param {string} text - Texto a ser criptografado
 * @returns {string} Texto criptografado em formato hex
 */
function encrypt(text) {
  if (!text) return '';
  
  try {
    const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Retorna IV + texto criptografado
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Erro ao criptografar:', error);
    throw new Error('Falha na criptografia de dados');
  }
}

/**
 * Descriptografa dados sensíveis
 * @param {string} text - Texto criptografado
 * @returns {string} Texto original
 */
function decrypt(text) {
  if (!text) return '';
  
  try {
    const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
    const parts = text.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Erro ao descriptografar:', error);
    return text; // Retorna original se falhar (para compatibilidade com dados antigos)
  }
}

/**
 * Hash irreversível para comparações (CPF)
 * @param {string} text - Texto a ser hasheado
 * @returns {string} Hash SHA-256
 */
function hash(text) {
  if (!text) return '';
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Mascara dados sensíveis para exibição
 * @param {string} cpf - CPF para mascarar
 * @returns {string} CPF mascarado (XXX.XXX.XXX-XX)
 */
function maskCPF(cpf) {
  if (!cpf) return '';
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return cpf;
  return `***.***.${cleaned.substr(6, 3)}-**`;
}

/**
 * Mascara telefone para exibição
 * @param {string} telefone - Telefone para mascarar
 * @returns {string} Telefone mascarado
 */
function maskTelefone(telefone) {
  if (!telefone) return '';
  const cleaned = telefone.replace(/\D/g, '');
  if (cleaned.length < 10) return telefone;
  return `(${cleaned.substr(0, 2)}) *****-${cleaned.substr(-4)}`;
}

/**
 * Mascara email para exibição
 * @param {string} email - Email para mascarar
 * @returns {string} Email mascarado
 */
function maskEmail(email) {
  if (!email) return '';
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const username = parts[0];
  const domain = parts[1];
  const maskedUsername = username.length > 2 
    ? username[0] + '*'.repeat(username.length - 2) + username[username.length - 1]
    : username;
  return `${maskedUsername}@${domain}`;
}

module.exports = {
  encrypt,
  decrypt,
  hash,
  maskCPF,
  maskTelefone,
  maskEmail
};
