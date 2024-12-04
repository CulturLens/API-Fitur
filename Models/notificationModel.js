const db = require('../config/db');

function addNotification(userId, forumId, type, message) {
  const query = 'INSERT INTO notifications (userId, forumId, message) VALUES (?, ?, ?)';
  db.query(query, [userId, forumId, message], (err, result) => {
    if (err) {
      console.log('Error creating notification:', err);
    }
  });
}

module.exports = { addNotification };
