const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
const uploadDir = path.join(__dirname, 'uploads');

// Ensure the upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Set up multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({ storage });

// Helper function to calculate file hash
const calculateFileHash = (filePath) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5');
    const stream = fs.createReadStream(filePath);

    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', (err) => reject(err));
  });
};

// Check if file hash already exists
const isDuplicateFile = async (hash) => {
  const hashFilePath = path.join(uploadDir, 'file_hashes.json');

  // Read existing hashes
  let fileHashes = [];
  if (fs.existsSync(hashFilePath)) {
    fileHashes = JSON.parse(fs.readFileSync(hashFilePath, 'utf8'));
  }

  // Check for duplicates
  if (fileHashes.includes(hash)) {
    return true;
  }

  // Save new hash
  fileHashes.push(hash);
  fs.writeFileSync(hashFilePath, JSON.stringify(fileHashes, null, 2));
  return false;
};

app.post('/upload', upload.single('image'), async (req, res) => {
  const filePath = path.join(uploadDir, req.file.filename);

  try {
    const fileHash = await calculateFileHash(filePath);

    if (await isDuplicateFile(fileHash)) {
      fs.unlinkSync(filePath); // Remove duplicate file
      return res.status(400).json({ message: 'Duplicate file uploaded' });
    }

    res.json({ filePath: `/${req.file.filename}` });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

const PORT = 5001;
app.listen(PORT, () => console.log(`File upload server running on port ${PORT}`));
