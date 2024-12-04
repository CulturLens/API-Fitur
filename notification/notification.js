// notification.js
const { notifyUser } = require('../websocket');  // Impor WebSocket untuk notifikasi real-time

// Fungsi untuk menambah komentar dan mengirimkan notifikasi
function addCommentAndNotify(userId, forumId, message) {
  // Logika untuk menyimpan komentar di database (bisa disesuaikan)
  console.log(`Komentar ditambahkan oleh User ${userId} pada Forum ${forumId}: ${message}`);

  // Kirim notifikasi ke pengguna yang terkait melalui WebSocket atau metode lain
  notifyUser(forumId, message);
}

// Fungsi untuk menambah like dan mengirimkan notifikasi
function addLikeAndNotify(userId, forumId, message) {
  // Logika untuk menyimpan like di database (bisa disesuaikan)
  console.log(`Like ditambahkan oleh User ${userId} pada Forum ${forumId}: ${message}`);

  // Kirim notifikasi ke pengguna yang terkait melalui WebSocket atau metode lain
  notifyUser(forumId, message);
}

module.exports = {
  addCommentAndNotify,
  addLikeAndNotify
};
