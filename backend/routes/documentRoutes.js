// routes/documentRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const documentController = require('../controllers/documentController');

// Setup Multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

// --- Existing routes ---

// GET /api/documents/
// fetch all manuscripts
router.get('/', documentController.getAll);

// POST /api/documents/draft
router.post('/draft', upload.single('image'), documentController.createDraft);

// POST /api/documents/create
router.post('/create', upload.single('image'), documentController.createFinal);

console.log('DEBUG: documentRoutes is loaded!');

// Test route
router.get('/test', (req, res) => {
  console.log('DEBUG: /api/documents/test was called');
  res.json({ message: 'test route works' });
});

// GET /api/documents/:filename
router.get('/:filename', documentController.getByFilename);



module.exports = router;
