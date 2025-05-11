const express = require('express');
const router = express.Router();
const phyloController = require('../controllers/phyloController');

// @route  GET /api/phylo/tree
router.get('/tree', phyloController.getPhylogeneticTree);

module.exports = router;
