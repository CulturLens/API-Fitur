const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../config/db"); // Database connection
const upload = require("../config/storage"); // File upload configuration
const { body, validationResult } = require("express-validator");

// =================== Middleware ===================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Access token required" });

  jwt.verify(token, "your_secret_key", (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user; // Menyimpan user yang didekode ke dalam req.user
    next();
  });
};

// =================== CRUD USER ===================
// POST: Register User
router.post(
  "/register",
  upload.single("photo"), // Menambahkan middleware untuk upload foto
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("username").notEmpty().withMessage("Username is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, username } = req.body;
    // Jika foto tidak di-upload, set null
    const profilePhoto = req.file ? req.file.path : null;  

    // Hash password sebelum menyimpannya
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `INSERT INTO users (name, email, password, username, profilePhoto) VALUES (?, ?, ?, ?, ?)`;
    
    db.query(query, [name, email, hashedPassword, username, profilePhoto], (err, result) => {
      if (err) return res.status(500).json({ message: "Error registering user", error: err });
      res.status(201).json({ message: "User registered successfully" });
    });
  }
);

// =================== CRUD USER ===================
// GET: Get All Users
router.get("/users", (req, res) => {
  const query = `SELECT id, name, email, username, profilePhoto, phone FROM users`;
  db.query(query, (err, result) => {
    if (err) return res.status(500).json({ message: "Error fetching users", error: err });
    res.status(200).json(result);
  });
});

// GET: Get User by ID
router.get("/user/:id", (req, res) => {
  const { id } = req.params;

  // Query untuk mendapatkan data pengguna berdasarkan ID
  const query = `SELECT id, name, email, username, profilePhoto, phone FROM users WHERE id = ?`;
  db.query(query, [id], (err, result) => {
    if (err) return res.status(500).json({ message: "Error fetching user data", error: err });

    if (result.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Menampilkan data pengguna yang ditemukan
    res.status(200).json(result[0]);
  });
});


// PUT: Edit User (Allowing phone and photo to be updated)
router.put(
  "/user/:id",
  upload.single("profilePhoto"), // Middleware untuk menangani upload file
  [
    body("phone").optional().isMobilePhone().withMessage("Valid phone number is required"), // Validasi untuk phone
  ],
  async (req, res) => {
    const { id } = req.params;
    const { phone } = req.body;
    const photo = req.file ? req.file.path : null;

    // Menyiapkan fields dan values untuk update
    const updateFields = [];
    const updateValues = [];

    if (phone) {
      updateFields.push("phone = ?");
      updateValues.push(phone);
    }

    if (photo) {
      updateFields.push("profilePhoto = ?");
      updateValues.push(photo);  // Gunakan photo di sini
    }

    // Cek apakah ada field yang akan diupdate
    if (updateFields.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    // Menambahkan ID pengguna yang ingin diupdate
    updateValues.push(id);

    const query = `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`;

    // Eksekusi query
    db.query(query, updateValues, (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Error updating user", error: err });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(200).json({ message: "User updated successfully" });
    });
  }
);

// DELETE: Delete User and Associated Posts (No authentication required)
router.delete("/user/:id", (req, res) => {
  const { id } = req.params;

  // Hapus semua forum posts yang dibuat oleh pengguna (menggunakan user_id)
  const deletePostsQuery = `DELETE FROM forums WHERE user_id = ?`;
  db.query(deletePostsQuery, [id], (err) => {
    if (err) {
      return res.status(500).json({ message: "Error deleting user posts", error: err });
    }

    // Hapus semua komentar yang dibuat oleh pengguna
    const deleteCommentsQuery = `DELETE FROM comments WHERE user_id = ?`;
    db.query(deleteCommentsQuery, [id], (err) => {
      if (err) {
        return res.status(500).json({ message: "Error deleting user comments", error: err });
      }

      // Hapus pengguna dari database
      const deleteUserQuery = `DELETE FROM users WHERE id = ?`;
      db.query(deleteUserQuery, [id], (err, result) => {
        if (err) {
          return res.status(500).json({ message: "Error deleting user", error: err });
        }
        if (result.affectedRows === 0) {
          return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ message: "User and associated data deleted successfully" });
      });
    });
  });
});


// POST: Login User
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const query = `SELECT * FROM users WHERE email = ?`;
  db.query(query, [email], async (err, result) => {
    if (err || result.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const user = result[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate the access token
    const token = jwt.sign({ id: user.id, name: user.name }, "your_secret_key", { expiresIn: "1h" });

    // Optionally, generate a refresh token
    const refreshToken = jwt.sign({ id: user.id, name: user.name }, "your_refresh_secret_key", { expiresIn: "7d" });

    // Send the response with both tokens and a success message
    res.json({
      message: "Login successful",
      token: token,
      refreshToken: refreshToken,
    });
  });
});

module.exports = router;


// =================== CRUD FORUM ===================

// POST: Create Forum Post (Tanpa token)
router.post(
  "/forum",
  upload.single("image"),
  [
    body("title").notEmpty().withMessage("Title is required"),
    body("description").notEmpty().withMessage("Description is required"),
    body("username").notEmpty().withMessage("Username is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, username } = req.body;
    const image = req.file ? req.file.path : null;

    // Menggunakan query untuk menambahkan post forum tanpa memerlukan user_id atau token
    const query = `INSERT INTO forums (title, description, username, image) VALUES (?, ?, ?, ?)`;
    db.query(query, [title, description, username, image], (err, result) => {
      if (err) return res.status(500).json({ message: "Error creating post", error: err });
      res.status(201).json({ message: "Post created successfully" });
    });
  }
);

// GET: Get All Forums
router.get("/forums", (req, res) => {
  const query = `SELECT * FROM forums`;
  db.query(query, (err, result) => {
    if (err) return res.status(500).json({ message: "Error fetching forums", error: err });
    res.status(200).json(result);
  });
});

// GET: Get Forum by ID
router.get("/forum/:id", (req, res) => {
  const { id } = req.params;

  const query = `SELECT * FROM forums WHERE id = ?`;
  db.query(query, [id], (err, result) => {
    if (err) return res.status(500).json({ message: "Error fetching forum data", error: err });

    if (result.length === 0) {
      return res.status(404).json({ message: "Forum not found" });
    }

    res.status(200).json(result[0]);
  });
});

// DELETE: Delete Forum Post (Automatically delete comments) without token
router.delete("/forum/:id", (req, res) => {
  const { id } = req.params;

  // Hapus komentar yang terkait dengan forum post
  const deleteCommentsQuery = `DELETE FROM comments WHERE post_id = ?`;
  db.query(deleteCommentsQuery, [id], (err) => {
    if (err) return res.status(500).json({ message: "Error deleting comments", error: err });

    // Hapus forum post itu sendiri
    const deletePostQuery = `DELETE FROM forums WHERE id = ?`;
    db.query(deletePostQuery, [id], (err, result) => {
      if (err) return res.status(500).json({ message: "Error deleting post", error: err });
      res.status(200).json({ message: "Post and associated comments deleted successfully" });
    });
  });
});

// =================== CRUD NOTIFICATION ===================

// POST: Create Notification
router.post("/notification", authenticateToken, async (req, res) => {
  const { title, message } = req.body;
  const query = `INSERT INTO notifications (title, message) VALUES (?, ?)`;
  db.query(query, [title, message], (err, result) => {
    if (err) return res.status(500).json({ message: "Error creating notification", error: err });
    res.status(201).json({ message: "Notification created successfully" });
  });
});

// DELETE: Delete Notification
router.delete("/notification/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  const query = `DELETE FROM notifications WHERE id = ?`;
  db.query(query, [id], (err, result) => {
    if (err) return res.status(500).json({ message: "Error deleting notification", error: err });
    res.status(200).json({ message: "Notification deleted successfully" });
  });
});

// =================== CRUD FORUM ===================

// POST: Like a Post
router.post("/forum/:id/like", authenticateToken, (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body; // assuming user_id is passed from the client

  const checkLikeQuery = `SELECT * FROM likes WHERE user_id = ? AND post_id = ?`;
  db.query(checkLikeQuery, [user_id, id], (err, result) => {
    if (err) return res.status(500).json({ message: "Error checking like", error: err });

    if (result.length > 0) {
      return res.status(400).json({ message: "You already liked this post" });
    }

    const insertLikeQuery = `INSERT INTO likes (user_id, post_id) VALUES (?, ?)`;
    db.query(insertLikeQuery, [user_id, id], (err, result) => {
      if (err) return res.status(500).json({ message: "Error liking post", error: err });

      // Get the post owner to send notification
      const getPostOwnerQuery = `SELECT user_id FROM forum_posts WHERE id = ?`;
      db.query(getPostOwnerQuery, [id], (err, result) => {
        if (err) return res.status(500).json({ message: "Error getting post owner", error: err });

        const postOwner = result[0].user_id;

        // Send notification to the post owner
        const notificationMessage = `${req.user.name} liked your post: ${id}`;
        const notificationQuery = `INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)`;
        db.query(notificationQuery, [postOwner, "New Like on Your Post", notificationMessage], (err, result) => {
          if (err) return res.status(500).json({ message: "Error sending notification", error: err });

          res.status(200).json({ message: "Like added and notification sent" });
        });
      });
    });
  });
});

module.exports = router;
