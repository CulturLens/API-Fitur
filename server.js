const express = require("express");
const app = express();
const routes = require("./routes/routes"); // Menghubungkan routes
const db = require("./config/db"); // Menggunakan pool dari db.js

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes
app.use("/api", routes);

// Default route
app.get("/", (req, res) => {
  res.send("Server is running and ready!");
});

// Database connection check (menggunakan pool)
db.query("SELECT 1", (err, results) => {
  if (err) {
    console.error('Database connection error:', err);
    process.exit(1); // Jika gagal terkoneksi, hentikan aplikasi
  }
  console.log("Connected to the database successfully.");
});

// Port listening
const PORT = process.env.PORT || 3200;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
