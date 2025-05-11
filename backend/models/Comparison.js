const mongoose = require('mongoose');

const WordComparisonSchema = new mongoose.Schema({
  verseNumber: { type: Number, required: true },
  word1: { type: String, required: true },
  word2: { type: String, required: true },
  position: { type: Number, required: true },
  manuscriptSigla: { type: String, required: true },
});

const ComparisonSchema = new mongoose.Schema({
  wordComparison: { type: WordComparisonSchema, required: true },
  isSignificant: { type: Boolean, required: true },
  variationType: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Comparison', ComparisonSchema);
