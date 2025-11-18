const express = require('express');
const router = express.Router();
const controller = require('../controllers/veiculosController');

router.post('/', controller.create);
router.get('/', controller.list);
router.put('/:id', controller.update);

module.exports = router;
