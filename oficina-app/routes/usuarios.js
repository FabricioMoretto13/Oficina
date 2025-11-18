const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { verificarAdmin } = require('../middleware/adminAuth');

router.post('/registrar', usuarioController.registrarUsuario);
router.post('/validar-filial', usuarioController.validarFilial);
router.get('/listar', verificarAdmin, usuarioController.listarUsuarios);
router.patch('/:id/status', verificarAdmin, usuarioController.atualizarStatus);

module.exports = router;
