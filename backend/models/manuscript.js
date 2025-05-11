const mongoose = require('mongoose');

const VerseSchema = new mongoose.Schema({
  verse_number: { type: Number, required: true },
  verse_text: { type: String, required: true },
});

const MetadataSchema = new mongoose.Schema({
  MSID: { type: String },              // 'MS ID:'
  OtherNames: { type: String },        // 'Other Names:'
  Contents: { type: String },          // 'Contents:'
  Date: { type: String },              // 'Date:'
  Origin: { type: String },            // 'Origin:'
  TotalFolia: { type: String },        // 'Total Folia:'
  Dimensions: { type: String },        // 'Dimensions:'
  Materials: { type: String },         // 'Materials:'
  LaodFolia: { type: String },         // 'Laod Folia:'
  FormatDescription: { type: String }, // 'Format Description:'
});

const ManuscriptSchema = new mongoose.Schema({
  filename: { type: String, required: true, unique: true },
  metadata: { type: MetadataSchema, default: {} },
  verses: [VerseSchema],
  
  // If you want to store the image as raw buffer:
  // image: { data: Buffer, contentType: String },

  // If you prefer storing a path or base64 string:
  image: { type: String, default: '' }, 

  // Could store a 'draft' or 'final' status
  status: { type: String, enum: ['draft', 'final'], default: 'draft' },
}, { timestamps: true });

module.exports = mongoose.model('Manuscript', ManuscriptSchema);
