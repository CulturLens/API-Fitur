const db = require('../config/db');
const { uploadFile } = require('../config/storage');

// Membuat Forum
exports.createForum = (req, res) => {
  const { username, caption } = req.body;
  const photoFile = req.file; // Ambil file foto yang diupload

  if (!photoFile) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  // Simpan Foto ke Google Cloud Storage
  uploadFile(photoFile.filename, photoFile.path).then(() => {
    // Cari userId berdasarkan username
    const userQuery = 'SELECT id FROM users WHERE username = ?';
    db.query(userQuery, [username], (err, userResult) => {
      if (err) {
        return res.status(500).json({ message: 'Error finding user', error: err });
      }
      if (userResult.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      const userId = userResult[0].id; // Ambil userId dari hasil query

      // Simpan forum post ke database
      const insertQuery = 'INSERT INTO forums (userId, caption, photoUrl) VALUES (?, ?, ?)';
      db.query(insertQuery, [userId, caption, photoFile.filename], (err, result) => {
        if (err) {
          return res.status(500).json({ message: 'Error creating forum', error: err });
        }

        // Kirimkan respon sukses
        res.status(200).json({
          message: 'Forum created successfully',
          forumId: result.insertId,
          username,
          caption,
          photoUrl: photoFile.path
        });
      });
    });
  }).catch((err) => {
    res.status(500).json({ message: 'Error uploading file', error: err });
  });
};

// Menambah Like pada Forum
exports.addLike = (req, res) => {
  const { forumId, username } = req.body;

  // Cari userId berdasarkan username
  const userQuery = 'SELECT id FROM users WHERE username = ?';
  db.query(userQuery, [username], (err, userResult) => {
    if (err) {
      return res.status(500).json({ message: 'Error finding user', error: err });
    }
    if (userResult.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userId = userResult[0].id; // Ambil userId dari hasil query
    const likeQuery = 'UPDATE forums SET likes = likes + 1 WHERE id = ?';

    db.query(likeQuery, [forumId], (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Error adding like', error: err });
      }

      // Kirim Notifikasi ke pemilik forum
      const notificationMessage = 'Someone liked your forum post!';
      const notificationQuery = 'SELECT userId FROM forums WHERE id = ?';
      db.query(notificationQuery, [forumId], (err, result) => {
        if (err) {
          return res.status(500).json({ message: 'Error finding forum owner', error: err });
        }

        const forumOwnerId = result[0].userId; // Ambil ID pemilik forum
        addNotification(forumOwnerId, forumId, 'like', notificationMessage);

        res.status(200).json({ message: 'Like added successfully and notification sent' });
      });
    });
  });
};

// Menambah Komentar pada Forum
exports.addComment = (req, res) => {
  const { forumId, username, comment } = req.body;

  // Cari userId berdasarkan username
  const userQuery = 'SELECT id FROM users WHERE username = ?';
  db.query(userQuery, [username], (err, userResult) => {
    if (err) {
      return res.status(500).json({ message: 'Error finding user', error: err });
    }
    if (userResult.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userId = userResult[0].id; // Ambil userId dari hasil query
    const commentQuery = 'INSERT INTO comments (forumId, userId, comment) VALUES (?, ?, ?)';

    db.query(commentQuery, [forumId, userId, comment], (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Error adding comment', error: err });
      }

      // Kirim Notifikasi ke pemilik forum
      const notificationMessage = `Your forum post got a comment: "${comment}"`;
      const notificationQuery = 'SELECT userId FROM forums WHERE id = ?';
      db.query(notificationQuery, [forumId], (err, result) => {
        if (err) {
          return res.status(500).json({ message: 'Error finding forum owner', error: err });
        }

        const forumOwnerId = result[0].userId; // Ambil ID pemilik forum
        addNotification(forumOwnerId, forumId, 'comment', notificationMessage);

        res.status(200).json({ message: 'Comment added successfully and notification sent' });
      });
    });
  });
};
