// config/storage.js
const multer = require("multer");

// Konfigurasi penyimpanan file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Folder tempat file disimpan
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + file.originalname); // Nama file dengan timestamp
  }
});

// Buat middleware multer
const upload = multer({ storage: storage });

module.exports = upload;
