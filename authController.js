const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const SALT_ROUNDS = 12;

async function register(req, res, next) {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: "username and password required" });

    const existing = await User.findOne({ username });
    if (existing) return res.status(409).json({ error: "username already taken" });

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({ username, passwordHash });

    return res.status(201).json({ id: user._id, username: user.username });
  } catch (err) {
    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: "username and password required" });

    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ error: "invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "invalid credentials" });

    const token = jwt.sign(
      { sub: String(user._id), username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    return res.json({ token });
  } catch (err) {
    return next(err);
  }
}

module.exports = { register, login };