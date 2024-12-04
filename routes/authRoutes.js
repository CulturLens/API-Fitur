const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Koneksi ke database
const jwt = require('jsonwebtoken');  // Pastikan Anda sudah menginstal 'jsonwebtoken'
const bcrypt = require('bcryptjs'); // Import bcrypt untuk hashing password

// POST: Register user
router.post('/register', (req, res) => {
  const { name, email, password, username } = req.body;

  // Hash password sebelum disimpan di database
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      console.error('Error hashing password:', err);
      return res.status(500).json({ message: 'Error hashing password', error: err.message });
    }

    const query = 'INSERT INTO users (name, email, password, username) VALUES (?, ?, ?, ?)';
    db.query(query, [name, email, hashedPassword, username], (err, result) => {
      if (err) {
        console.error('Error inserting data:', err);
        return res.status(500).json({ message: 'Database error', error: err.message });
      }
      res.status(201).json({ message: 'User registered successfully', user: { id: result.insertId, name, email, username } });
    });
  });
});

// POST: Login user
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Cek apakah email ada di database
  const query = 'SELECT * FROM users WHERE email = ?';
  db.query(query, [email], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Database error', error: err.message });
    }

    if (result.length === 0) {
      // Jika email tidak ada
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verifikasi password yang dimasukkan dengan yang disimpan (hashed)
    bcrypt.compare(password, result[0].password, (err, isMatch) => {
      if (err) {
        console.error('Error comparing passwords:', err);
        return res.status(500).json({ message: 'Error comparing passwords', error: err.message });
      }

      if (!isMatch) {
        // Jika password tidak cocok
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Jika login berhasil, buat JWT token dan refresh token
      const user = result[0];

      // Generate access token (short-lived)
      const accessToken = jwt.sign({ id: user.id, email: user.email }, 'your_secret_key', { expiresIn: '1h' });

      // Generate refresh token (long-lived)
      const refreshToken = jwt.sign({ id: user.id, email: user.email }, 'your_refresh_secret_key', { expiresIn: '7d' });

      // Simpan refresh token di database (opsional)
      db.query('UPDATE users SET refresh_token = ? WHERE id = ?', [refreshToken, user.id], (err, result) => {
        if (err) {
          console.error('Error storing refresh token:', err);
        }
      });

      res.status(200).json({
        message: 'Login successful',
        accessToken,  // Kirimkan token ke frontend untuk digunakan dalam autentikasi selanjutnya
        refreshToken, // Kirimkan refresh token untuk mendapatkan token baru ketika akses token kadaluarsa
      });
    });
  });
});

// POST: Refresh access token using refresh token
router.post('/refresh-token', (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token is required' });
  }

  // Verify the refresh token
  jwt.verify(refreshToken, 'your_refresh_secret_key', (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    // If the refresh token is valid, create a new access token
    const newAccessToken = jwt.sign({ id: decoded.id, email: decoded.email }, 'your_secret_key', { expiresIn: '1h' });

    res.status(200).json({
      message: 'Access token refreshed successfully',
      accessToken: newAccessToken,
    });
  });
});

// GET: Get all users
router.get('/users', (req, res) => {
  const query = 'SELECT * FROM users';
  db.query(query, (err, result) => {
    if (err) {
      console.error('Error retrieving users:', err);
      return res.status(500).json({ message: 'Database error', error: err.message });
    }
    res.status(200).json({ users: result });
  });
});

// GET: Get user by ID
router.get('/users/:id', (req, res) => {
  const userId = req.params.id;
  const query = 'SELECT * FROM users WHERE id = ?';
  db.query(query, [userId], (err, result) => {
    if (err) {
      console.error('Error retrieving user:', err);
      return res.status(500).json({ message: 'Database error', error: err.message });
    }
    if (result.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ user: result[0] });
  });
});

// PUT: Update user by ID
router.put('/users/:id', (req, res) => {
  const userId = req.params.id;
  const { name, email, password, username } = req.body;

  // Hash password jika diubah
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      console.error('Error hashing password:', err);
      return res.status(500).json({ message: 'Error hashing password', error: err.message });
    }

    const query = 'UPDATE users SET name = ?, email = ?, password = ?, username = ? WHERE id = ?';
    db.query(query, [name, email, hashedPassword, username, userId], (err, result) => {
      if (err) {
        console.error('Error updating user:', err);
        return res.status(500).json({ message: 'Database error', error: err.message });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.status(200).json({ message: 'User updated successfully' });
    });
  });
});

// DELETE: Delete user by ID
router.delete('/users/:id', (req, res) => {
  const userId = req.params.id;
  const query = 'DELETE FROM users WHERE id = ?';
  db.query(query, [userId], (err, result) => {
    if (err) {
      console.error('Error deleting user:', err);
      return res.status(500).json({ message: 'Database error', error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User deleted successfully' });
  });
});

module.exports = router;
