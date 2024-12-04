const notificationModel = require("../Models/notificationModel");

exports.createNotification = async (req, res) => {
  const { userId, message } = req.body;

  if (!userId || !message) {
    return res.status(400).json({ message: "User ID and message are required" });
  }

  try {
    const notification = await notificationModel.createNotification(userId, message);
    res.status(201).json({ message: "Notification created successfully", notification });
  } catch (err) {
    res.status(500).json({ message: "Error creating notification", error: err.message });
  }
};
