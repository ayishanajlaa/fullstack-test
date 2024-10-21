const express = require('express');
const multer = require('multer');
const File = require('../models/File');
const { verifyToken } = require('../middleware/auth');
const crypto = require('crypto'); 
const fs = require('fs');
const { v4: uuidv4 } = require('uuid'); 


const router = express.Router();

const path = require('path');

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Make sure this folder exists
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Append timestamp to filename
  }
});

// Initialize multer with storage configuration
const upload = multer({ storage: storage });

// Route to handle file uploads
router.post('/upload', verifyToken, upload.single('file'), async (req, res) => {
  try {
    const { tags } = req.body;

    const uniqueLink = crypto.randomBytes(16).toString('hex');

    const file = new File({
      user: req.user.id,
      filename: req.file.filename,
      fileType: req.file.mimetype.startsWith('image') ? 'image' : 'video',
      tags: tags ? tags.split(',') : [], // Split tags into array if they exist
      url: `/uploads/${req.file.filename}`,
      sharedLinks: [uniqueLink]
        });

    await file.save();
    res.json({ message: 'File uploaded successfully', file });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Route to create a random shareable link
router.post('/file/:id/create-link', verifyToken, async (req, res) => {
  try {
      const file = await File.findById(req.params.id);

      if (!file || file.user.toString() !== req.user.id) {
          return res.status(404).json({ error: 'File not found or unauthorized' });
      }

      const customName = uuidv4(); // Generates a random UUID

      // Add the new shareable link to the array
      file.sharedLinks.push(customName); 
      await file.save(); 

      res.json({ message: 'Shareable link created', shareableLink: customName });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create shareable link' });
  }
});

router.get('/files-view/:customName', async (req, res) => {
  try {
      const file = await File.findOne({ sharedLinks: req.params.customName });

      if (!file) {
          return res.status(404).json({ error: 'File not found' });
      }

      file.views += 1; // Increment the views field
      await file.save();
      const filePath = path.join(__dirname, '../', file.url); 
      // Return file in base64 format
      const fileData = fs.readFileSync(filePath); // Use the correct path according to your setup
      const base64Data = Buffer.from(fileData).toString('base64');
      res.json({ base64: base64Data, filename: file.filename, fileType: file.fileType });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch file' });
  }
});


router.patch('/add-tags/:id', verifyToken, async (req, res) => {
  try {
      const { tags } = req.body; 
      const file = await File.findById(req.params.id);
      
      if (!file || file.user.toString() !== req.user.id) {
          return res.status(404).json({ error: 'File not found or unauthorized' });
      }
      
      if (tags && Array.isArray(tags)) {
          
          const newTags = tags.map(tag => tag.trim()).filter(tag => tag !== '');
          file.tags = [...new Set([...file.tags, ...newTags])]; 
      }

      await file.save();
      res.json({ message: 'Tags updated', file });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to update tags' });
  }
});



router.get('/get-files', verifyToken, async (req, res) => {
    try {
        const files = await File.find({ user: req.user.id });

        // Get base64 data for each file
        const formattedFiles = await Promise.all(files.map(async file => {
            const filePath = path.join(__dirname, '..', 'uploads', file.filename); 
            const fileData = fs.readFileSync(filePath);
            const base64File = fileData.toString('base64');
            
            return {
                id: file._id,
                filename: file.filename,
                fileType: file.fileType,
                base64: base64File,
                tags: file.tags,
                views: file.views,
                sharedLinks: file.sharedLinks,
                uploadedAt: file.createdAt.toISOString() 
            };
        }));

        res.json({ files: formattedFiles });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch files' });
    }
});


module.exports = router;
