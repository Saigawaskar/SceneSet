const AppError = require('../utils/appError');

function notFound(req, _res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404, 'ROUTE_NOT_FOUND'));
}

// Error messages are safe for client display; stack traces are kept server-side.
function errorHandler(err, _req, res, _next) {
  let status = err.statusCode || 500;
  let code = err.code || 'SERVER_ERROR';
  let message = status >= 500 ? 'Something went wrong. Please try again.' : err.message;

  if (err.name === 'ValidationError') {
    status = 400; code = 'VALIDATION_ERROR';
    message = Object.values(err.errors).map((item) => item.message).join(', ');
  } else if (err.code === 11000) {
    status = 409; code = 'DUPLICATE_VALUE';
    message = 'This value is already in use.';
  } else if (err.name === 'CastError') {
    status = 400; code = 'INVALID_ID'; message = 'The provided ID is invalid.';
  } else if (err.name === 'ZodError') {
    status = 400; code = 'VALIDATION_ERROR';
    message = err.issues.map((issue) => issue.message).join(', ');
  }

  if (process.env.NODE_ENV !== 'test') console.error(`[${code}]`, err.message);
  res.status(status).json({ error: { code, message } });
}

module.exports = { notFound, errorHandler };
