  const mysql = require('mysql');

  const db = mysql.createConnection({
    host: '34.101.250.119',  // Alamat IP Public Google Cloud SQL Instance Anda
    user: 'culturlenss',       // Username database Anda
    password: 'culturlens_$4@2', // Password database Anda
    database: 'db_culturlens' // Nama database Anda
  });

  db.connect((err) => {
    if (err) {
      console.error('Database connection error:', err);
      return;
    }
    console.log('Connected to the database');
  });

  module.exports = db;
