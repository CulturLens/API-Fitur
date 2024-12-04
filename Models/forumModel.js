const db = require("../config/db");

exports.createForumPost = (userId, username, userPhoto, postPhoto, caption, likesCount, callback) => {
  const query = "INSERT INTO posts (userId, username, userPhoto, postPhoto, caption, likesCount) VALUES (?, ?, ?, ?, ?, ?)";
  db.query(query, [userId, username, userPhoto, postPhoto, caption, likesCount], (err, result) => {
    if (err) {
      console.error("Error creating forum post:", err);
      callback(err, null);
    } else {
      callback(null, result.insertId); // Mengembalikan ID post yang baru dibuat
    }
  });
};

exports.createForumComment = (postId, userId, username, userPhoto, comment, callback) => {
  const query = "INSERT INTO comments (postId, userId, username, userPhoto, comment) VALUES (?, ?, ?, ?, ?)";
  db.query(query, [postId, userId, username, userPhoto, comment], (err, result) => {
    if (err) {
      console.error("Error adding comment:", err);
      callback(err, null);
    } else {
      callback(null, result.insertId); // Mengembalikan ID komentar yang baru dibuat
    }
  });
};
