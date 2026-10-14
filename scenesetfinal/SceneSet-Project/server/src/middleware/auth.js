const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');

const cookieName = () => process.env.COOKIE_NAME || 'sceneset_token';

const requireAuth = asyncHandler(async (req, _res, next) => {
  const token = req.cookies?.[cookieName()];
  if (!token) throw new AppError('Please sign in to continue.', 401, 'UNAUTHENTICATED');
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (_error) {
    throw new AppError('Your session has expired. Please sign in again.', 401, 'INVALID_SESSION');
  }
  const user = await User.findById(payload.sub);
  if (!user) throw new AppError('Account not found.', 401, 'ACCOUNT_NOT_FOUND');
  req.user = user;
  next();
});

function cookieOptions() {
  const sameSite = ['lax', 'strict', 'none'].includes((process.env.COOKIE_SAME_SITE || 'lax').toLowerCase())
    ? (process.env.COOKIE_SAME_SITE || 'lax').toLowerCase() : 'lax';
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' || sameSite === 'none',
    sameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/'
  };
}

function setAuthCookie(res, userId) {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new Error('JWT_SECRET must be set to a random value of at least 32 characters.');
  const token = jwt.sign({ sub: String(userId) }, secret, { expiresIn: '7d' });
  res.cookie(cookieName(), token, cookieOptions());
}

function clearAuthCookie(res) {
  const options = cookieOptions();
  delete options.maxAge;
  res.clearCookie(cookieName(), options);
}

module.exports = { requireAuth, setAuthCookie, clearAuthCookie };
