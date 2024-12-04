const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "your-access-secret";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "your-refresh-secret";

// Simulating a database (for demo purposes)
let users = [];

exports.register = async (name, email, password, username) => {
  // Check if user already exists
  const existingUser = users.find((user) => user.email === email);
  if (existingUser) {
    throw new Error("User already exists");
  }

  // Hash the password before storing
  const hashedPassword = await bcrypt.hash(password, 10);

  // Simulate storing the user
  const newUser = { id: users.length + 1, name, email, password: hashedPassword, username };
  users.push(newUser);

  return newUser;
};

exports.login = async (email, password) => {
  const user = users.find((u) => u.email === email);
  if (!user) {
    throw new Error("User not found");
  }

  // Compare password with stored hash
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  // Create JWT tokens
  const accessToken = jwt.sign({ userId: user.id }, ACCESS_TOKEN_SECRET, { expiresIn: "1h" });
  const refreshToken = jwt.sign({ userId: user.id }, REFRESH_TOKEN_SECRET);

  return { accessToken, refreshToken };
};
