// googleCloud.js
const { Storage } = require('@google-cloud/storage');

// Inisialisasi Google Cloud Storage
const storage = new Storage({
  keyFilename: 'path-to-your-google-cloud-credentials.json', // Ganti dengan path ke file kredensial JSON Anda
});

const bucket = storage.bucket('your-bucket-name'); // Ganti dengan nama bucket Anda

module.exports = { bucket };
