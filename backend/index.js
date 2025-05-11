require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import routes
const documentRoutes = require('./routes/documentRoutes');
const comparisonRoutes = require('./routes/comparisonRoutes');
const phyloRoutes = require('./routes/phyloRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // for parsing JSON bodies

// Database Connection
const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/phylo-app';
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB');
});
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

// Routes
app.use('/api/documents', documentRoutes);
app.use('/api/comparisons', comparisonRoutes);
app.use('/api/phylo', phyloRoutes);

// Start the server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
