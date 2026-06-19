import { User } from "../models/User.js";
import { signToken } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email, password are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "password must be at least 6 chars" });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ error: "Email already registered" });
  }

  const user = new User({ name, email });
  await user.setPassword(password);
  await user.save();

  const token = signToken(user._id);
  res.status(201).json({ token, user });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: (email || "").toLowerCase() });
  if (!user || !(await user.verifyPassword(password || ""))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = signToken(user._id);
  res.json({ token, user });
});
