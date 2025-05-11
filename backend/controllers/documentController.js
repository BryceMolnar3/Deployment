const Manuscript = require('../models/manuscript');

exports.getByFilename = async (req, res) => {
    console.log("DEBUG: In getByFilename, param =", req.params.filename);
  
    try {
      const { filename } = req.params;
      const manuscript = await Manuscript.findOne({ filename });
      console.log("DEBUG: Query returned =>", manuscript);
  
      if (!manuscript) {
        return res.status(404).json({ error: 'Manuscript not found dummy' });
      }
      
      return res.json(manuscript);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to fetch manuscript' });
    }
  };
  

// Create or save as draft
// POST /api/documents/draft
exports.createDraft = async (req, res) => {
  try {
    // The frontend sends multipart/form-data, which includes:
    // - document (JSON string)
    // - image (optional)

    // 1. Parse the JSON string from 'document'.
    const { document } = req.body;
    if (!document) {
      return res.status(400).json({ error: 'No document data provided.' });
    }

    const parsed = JSON.parse(document);
    const { filename, metadata, verses } = parsed;
    if (!filename) {
      return res.status(400).json({ error: 'Filename is required.' });
    }

    // 2. Construct the manuscript object
    const newManuscript = new Manuscript({
      filename,
      metadata: {
        MSID: metadata['MS ID:'],
        OtherNames: metadata['Other Names:'],
        Contents: metadata['Contents:'],
        Date: metadata['Date:'],
        Origin: metadata['Origin:'],
        TotalFolia: metadata['Total Folia:'],
        Dimensions: metadata['Dimensions:'],
        Materials: metadata['Materials:'],
        LaodFolia: metadata['Laod Folia:'],
        FormatDescription: metadata['Format Description:'],
      },
      verses: verses || [],
      status: 'draft',
    });

    // 3. If an image was uploaded, attach it
    if (req.file) {
      // We can store a base64 string or a path. For example, base64:
      const base64 = req.file.buffer.toString('base64');
      const mimeType = req.file.mimetype;
      newManuscript.image = `data:${mimeType};base64,${base64}`;
    }

    // 4. Save
    await newManuscript.save();

    return res.json({ message: 'Draft saved successfully', manuscript: newManuscript });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to save draft' });
  }
};

// Create a final manuscript
// POST /api/documents/create
exports.createFinal = async (req, res) => {
  try {
    const { document } = req.body;
    if (!document) {
      return res.status(400).json({ error: 'No document data provided.' });
    }

    const parsed = JSON.parse(document);
    const { filename, metadata, verses } = parsed;
    if (!filename) {
      return res.status(400).json({ error: 'Filename is required.' });
    }

    // Create or update (you may prefer to ensure uniqueness, or just create a new doc)
    const manuscript = new Manuscript({
      filename,
      metadata: {
        MSID: metadata['MS ID:'],
        OtherNames: metadata['Other Names:'],
        Contents: metadata['Contents:'],
        Date: metadata['Date:'],
        Origin: metadata['Origin:'],
        TotalFolia: metadata['Total Folia:'],
        Dimensions: metadata['Dimensions:'],
        Materials: metadata['Materials:'],
        LaodFolia: metadata['Laod Folia:'],
        FormatDescription: metadata['Format Description:'],
      },
      verses,
      status: 'final',
    });

    if (req.file) {
      const base64 = req.file.buffer.toString('base64');
      const mimeType = req.file.mimetype;
      manuscript.image = `data:${mimeType};base64,${base64}`;
    }

    await manuscript.save();
    return res.json({ message: 'Manuscript created successfully', manuscript });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to submit manuscript' });
  }
};

// GET /api/documents/
// Fetch all manuscripts (or filter if needed)
exports.getAll = async (req, res) => {
  try {
    // If you only want final docs, do: { status: 'final' }
    const manuscripts = await Manuscript.find().sort({ createdAt: 1 });
    res.json(manuscripts);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to fetch manuscripts' });
  }
};
