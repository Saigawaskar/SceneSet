const express = require('express');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const User = require('../models/User');
const { requireAuth, setAuthCookie, clearAuthCookie } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');

const router = express.Router();
const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must contain at least 2 characters.').max(60),
  email: z.string().trim().email('Enter a valid email address.').max(254),
  password: z.string().min(8, 'Password must be at least 8 characters.').max(72)
});
const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.').max(72)
});

router.post('/register', asyncHandler(async (req, res) => {
  const data = registerSchema.parse(req.body);
  const email = data.email.toLowerCase();
  if (await User.exists({ email })) throw new AppError('An account with this email already exists.', 409, 'EMAIL_EXISTS');
  const passwordHash = await bcrypt.hash(data.password, 12);
  const user = await User.create({ name: data.name, email, passwordHash });
  setAuthCookie(res, user._id);
  res.status(201).json({ user: user.toJSON() });
}));

router.post('/login', asyncHandler(async (req, res) => {
  const data = loginSchema.parse(req.body);
  const user = await User.findOne({ email: data.email.toLowerCase() }).select('+passwordHash');
  const valid = user && await bcrypt.compare(data.password, user.passwordHash);
  if (!valid) throw new AppError('Email or password is incorrect.', 401, 'INVALID_CREDENTIALS');
  setAuthCookie(res, user._id);
  res.json({ user: user.toJSON() });
}));

router.post('/logout', (_req, res) => {
  clearAuthCookie(res);
  res.status(200).json({ message: 'You are signed out.' });
});

router.get('/me', requireAuth, (req, res) => res.json({ user: req.user.toJSON() }));

module.exports = router;
