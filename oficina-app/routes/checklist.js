const express = require('express');
const router = express.Router();
const controller = require('../controllers/checklistController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ensure uploads dir exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, uploadDir);
	},
	filename: function (req, file, cb) {
		const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
		cb(null, `${Date.now()}_${safeName}`);
	}
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// POST accepts multipart/form-data (files) or application/json. When files are sent,
// the client should include a JSON field `items` describing the itens array and
// reference file field names present in the fotos arrays.
router.post('/', upload.any(), controller.create);

// Envia checklist por WhatsApp
router.get('/', controller.list);
router.delete('/:id', controller.delete);
router.delete('/:checklistId/items/:itemId', controller.deleteItem);

module.exports = router;
