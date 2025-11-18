const express = require('express');
const router = express.Router();
const controller = require('../controllers/osController');


router.post('/', controller.create);
router.get('/', controller.list);
router.get('/total-veiculos-atendidos', controller.totalVeiculosAtendidos);
router.get('/:id', controller.getById);
router.put('/:id', controller.update);
router.patch('/:id/close', controller.close);
router.post('/:id/enviar-email', controller.enviarEmail);

module.exports = router;
