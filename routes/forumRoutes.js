const express = require("express");
const router = express.Router();
const upload = require("../config/storage"); // Pastikan path ini benar
const db = require("../config/db"); // Impor koneksi database
const { createForum, addLike, addComment } = require("../Controllers/forumController");
const { addLikeAndNotify, addCommentAndNotify } = require('../notification/notification'); // Import fungsi notifikasi

// Endpoint untuk posting forum dengan upload gambar
router.post("/", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const { username, caption } = req.body;
  const imageUrl = req.file.path;

  // Simpan data forum ke database
  const query = 'INSERT INTO forums (username, caption, photoUrl) VALUES (?, ?, ?)';
  db.query(query, [username, caption, imageUrl], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Error creating forum", error: err });
    }
    res.status(200).json({ message: "Forum created successfully", forumId: result.insertId });
  });
});

// Endpoint untuk menambahkan like pada forum
router.post("/like", (req, res) => {
  const { userId, forumId } = req.body;

  // Query untuk menambahkan like ke database
  const query = 'INSERT INTO likes (forumId, userId) VALUES (?, ?)';
  db.query(query, [forumId, userId], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Error liking forum', error: err.message });
    }

    // Kirim notifikasi setelah like ditambahkan
    const notificationMessage = `User ${userId} liked your post`;
    addLikeAndNotify(userId, forumId, notificationMessage);  // Kirim notifikasi

    res.status(200).json({ message: 'Post liked successfully', likeId: result.insertId });
  });
});

// Endpoint untuk menambahkan komentar pada forum
router.post("/comment", (req, res) => {
  const { userId, forumId, comment } = req.body;

  // Query untuk menambahkan komentar ke database
  const query = 'INSERT INTO comments (forumId, userId, comment) VALUES (?, ?, ?)';
  db.query(query, [forumId, userId, comment], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Error adding comment', error: err.message });
    }

    // Kirim notifikasi setelah komentar ditambahkan
    const notificationMessage = `User ${userId} commented: ${comment}`;
    addCommentAndNotify(userId, forumId, notificationMessage);  // Kirim notifikasi

    res.status(200).json({ message: 'Comment added successfully', commentId: result.insertId });
  });
});

module.exports = router;
