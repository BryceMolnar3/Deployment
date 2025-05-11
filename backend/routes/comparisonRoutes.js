const express = require('express');
const router = express.Router();
const comparisonController = require('../controllers/comparisonController');

// @route  POST /api/comparisons/
router.post('/', comparisonController.saveComparison);

module.exports = router;
