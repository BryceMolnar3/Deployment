const Comparison = require('../models/Comparison');

// POST /api/comparisons/
exports.saveComparison = async (req, res) => {
  try {
    const { wordComparison, isSignificant, variationType } = req.body;
    if (!wordComparison) {
      return res.status(400).json({ error: 'Missing wordComparison data' });
    }

    const newComparison = new Comparison({
      wordComparison,
      isSignificant,
      variationType,
    });

    await newComparison.save();

    return res.json({
      comparisonId: newComparison._id,
      isSignificant: newComparison.isSignificant,
      variationType: newComparison.variationType,
      wordComparison: newComparison.wordComparison,
      timestamp: newComparison.timestamp,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to save comparison' });
  }
};
