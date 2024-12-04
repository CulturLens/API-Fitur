// notificationRoutes.js
const express = require("express");
const router = express.Router();
const { getNotifications } = require("../Models/notificationModel");

router.get("/:userId", (req, res) => {
  const userId = req.params.userId;
  const notifications = getNotifications(userId);
  res.status(200).send({ notifications });
});

module.exports = router;
