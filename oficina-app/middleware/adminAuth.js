const ADMIN_EMAIL = 'fabriciomoretto73@gmail.com';

// Middleware para verificar se o usuário é admin
exports.verificarAdmin = (req, res, next) => {
  const emailFromHeader = req.headers['x-user-email'];
  
  console.log('Verificando admin. Email do header:', emailFromHeader);
  
  if (emailFromHeader === ADMIN_EMAIL) {
    console.log('Admin verificado com sucesso');
    return next();
  }
  
  console.log('Acesso negado - não é admin');
  return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem acessar este recurso.' });
};
