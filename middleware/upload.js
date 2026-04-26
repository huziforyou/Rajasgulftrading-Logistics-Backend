const multer = require('multer');
const path = require('path');

// Set storage engine
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    // Use /tmp for Vercel serverless compatibility
    const isVercel = process.env.VERCEL || process.env.NODE_ENV === 'production';
    const uploadPath = isVercel ? '/tmp' : path.join(__dirname, '../uploads');
    cb(null, uploadPath);
  },
  filename: function(req, file, cb) {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

// Check file type
function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|pdf|xlsx|xls|csv/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = /jpeg|jpg|png|pdf|vnd.openxmlformats-officedocument.spreadsheetml.sheet|vnd.ms-excel|text\/csv/.test(file.mimetype);

  if (mimetype || extname) {
    return cb(null, true);
  } else {
    cb('Error: Images, PDFs, and Excel Files Only!');
  }
}

// Init upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 5000000 }, // 5MB
  fileFilter: function(req, file, cb) {
    checkFileType(file, cb);
  }
});

module.exports = upload;
