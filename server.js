const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const { addCommentAndNotify } = require('./notification/notification'); // Impor fungsi notifikasi
const { notifyUser } = require('./websocket'); // Impor WebSocket untuk notifikasi real-time

// Middleware untuk parsing JSON
app.use(express.json());

// Konfigurasi Multer untuk menentukan lokasi penyimpanan file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');  // Menyimpan file di folder 'uploads'
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Menggunakan timestamp untuk nama file
  }
});

const upload = multer({ storage: storage });

// Pastikan folder uploads ada
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Impor routes
const authRoutes = require('./Routes/authRoutes');  // Mengimpor authRoutes
const forumRoutes = require('./Routes/forumRoutes');
const notificationRoutes = require('./Routes/notificationRoutes');

// Gunakan routes
app.use("/auth", authRoutes);  // Menambahkan route untuk autentikasi
app.use("/api/forum", forumRoutes);
app.use("/notification", notificationRoutes);

// Route untuk membuat postingan forum dengan upload gambar
app.post('/api/forum', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).send({ message: 'No file uploaded' });
  }

  // Ambil data dari request body dan file yang di-upload
  const newPost = {
    username: req.body.username,
    caption: req.body.caption,
    imageUrl: req.file.path, // Path file yang telah di-upload
  };

  // Query untuk menyimpan postingan ke database
  const query = 'INSERT INTO posts (username, caption, imageUrl) VALUES (?, ?, ?)';
  db.query(query, [newPost.username, newPost.caption, newPost.imageUrl], (err, result) => {
    if (err) {
      console.error('Error inserting data into database:', err);
      return res.status(500).send({ message: 'Database error' });
    }

    // Kirim response setelah berhasil menyimpan postingan
    res.status(200).send({
      message: 'Post created successfully',
      data: {
        id: result.insertId, // ID dari postingan yang baru saja dimasukkan
        ...newPost,
      },
    });

    // Kirim notifikasi setelah postingan berhasil dibuat dan komentar ditambahkan
    addCommentAndNotify(1, 2, 'Nice post!');  // Misalnya User 1 berkomentar pada post User 2
  });
});

// Route untuk mendapatkan semua postingan forum
app.get('/api/forum', (req, res) => {
  const query = 'SELECT * FROM posts';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error retrieving data from database:', err);
      return res.status(500).send({ message: 'Database error' });
    }

    res.status(200).send({
      message: 'Posts retrieved successfully',
      data: results,
    });
  });
});

// Route untuk mengambil postingan berdasarkan ID
app.get('/api/forum/:id', (req, res) => {
  const postId = req.params.id;
  const query = 'SELECT * FROM posts WHERE id = ?';
  db.query(query, [postId], (err, result) => {
    if (err) {
      console.error('Error retrieving data from database:', err);
      return res.status(500).send({ message: 'Database error' });
    }

    if (result.length === 0) {
      return res.status(404).send({ message: 'Post not found' });
    }

    res.status(200).send({
      message: 'Post retrieved successfully',
      data: result[0], // Mengambil postingan pertama (karena hasil query adalah array)
    });
  });
});

// Route untuk menambahkan komentar pada postingan forum
app.post('/api/forum/:id/comment', (req, res) => {
  const postId = req.params.id;
  const { userId, comment } = req.body;

  if (!comment) {
    return res.status(400).send({ message: 'Comment is required' });
  }

  // Menambahkan komentar ke dalam database
  const query = 'INSERT INTO comments (postId, userId, comment) VALUES (?, ?, ?)';
  db.query(query, [postId, userId, comment], (err, result) => {
    if (err) {
      console.error('Error inserting comment into database:', err);
      return res.status(500).send({ message: 'Database error' });
    }

    // Kirim notifikasi setelah komentar berhasil ditambahkan
    addCommentAndNotify(userId, postId, comment);

    res.status(200).send({
      message: 'Comment added successfully',
      data: {
        id: result.insertId,
        postId,
        userId,
        comment,
      },
    });
  });
});

// Route untuk menghapus postingan berdasarkan ID
app.delete('/api/forum/:id', (req, res) => {
  const postId = req.params.id;
  const query = 'DELETE FROM posts WHERE id = ?';
  db.query(query, [postId], (err, result) => {
    if (err) {
      console.error('Error deleting post from database:', err);
      return res.status(500).send({ message: 'Database error' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).send({ message: 'Post not found' });
    }

    res.status(200).send({
      message: 'Post deleted successfully',
    });
  });
});

// Route untuk menghapus komentar berdasarkan ID
app.delete('/api/forum/:postId/comment/:commentId', (req, res) => {
  const { postId, commentId } = req.params;
  const query = 'DELETE FROM comments WHERE id = ? AND postId = ?';
  db.query(query, [commentId, postId], (err, result) => {
    if (err) {
      console.error('Error deleting comment from database:', err);
      return res.status(500).send({ message: 'Database error' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).send({ message: 'Comment not found' });
    }

    res.status(200).send({
      message: 'Comment deleted successfully',
    });
  });
});

// Jalankan server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
