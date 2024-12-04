const authModel = require("../Models/authModel");

exports.register = async (req, res) => {
  const { name, email, password, username } = req.body;

  if (!name || !email || !password || !username) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const newUser = await authModel.register(name, email, password, username);
    res.status(201).json({ message: "User registered successfully", user: newUser });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const { accessToken, refreshToken } = await authModel.login(email, password);
    res.json({ message: "Login successful", accessToken, refreshToken });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
