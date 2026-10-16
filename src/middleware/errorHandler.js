'use strict';

const multer = require('multer');
const { logger } = require('../utils/logger');
const response = require('../utils/response');
const { env } = require('../config/env');

/**
 * Central error handler — the last middleware registered in server.js.
 * Never leaks stack traces, file paths, or raw DB errors to the client:
 * everything gets logged server-side, and the client gets a generic
 * message unless the error explicitly marked itself safe to show
 * (e.g. FileUpload's validation errors set err.status = 422 with a
 * user-facing message).
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const requestPath = req.originalUrl.split('?')[0].replace(/\/$/, '');
  const isSignup = req.method === 'POST' && requestPath === '/auth/signup';

  if (isSignup) {
    if (err instanceof multer.MulterError) {
      const message =
        err.code === 'LIMIT_FILE_SIZE'
          ? 'File exceeds the maximum allowed size.'
          : err.code === 'LIMIT_UNEXPECTED_FILE'
          ? 'Unexpected file field.'
          : 'File upload failed.';
      return response.contractError(res, 'validation', 'Validation failed.', 400, {
        [err.field || 'file']: [message],
      });
    }

    if (err.message === 'Not allowed by CORS') {
      logger.security('Blocked CORS request', { origin: req.get('origin'), path: req.path });
      return response.contractError(res, 'auth', 'Origin not allowed.', 403);
    }

    if (err.status === 401 || err.status === 403) {
      return response.contractError(res, 'auth', 'Authentication failed.', err.status);
    }

    if (err.status === 429) {
      return response.contractError(res, 'rate_limit', 'Too many requests. Please try again later.', 429);
    }

    if (err.status === 400 || err.status === 413 || err.status === 422) {
      const field = err.field || 'body';
      const issue = err.field ? err.message : 'Invalid request body.';
      return response.contractError(res, 'validation', 'Validation failed.', 400, { [field]: [issue] });
    }

    logger.error('Signup request failed', {
      message: err.message,
      stack: err.stack,
      path: req.path,
    });
    return response.contractError(res, 'server', 'We could not complete your request. Please try again later.', 500);
  }

  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'File exceeds the maximum allowed size.'
        : err.code === 'LIMIT_UNEXPECTED_FILE'
        ? 'Unexpected file field.'
        : 'File upload failed.';
    return response.validationError(res, { file: [message] });
  }

  if (err.message === 'Not allowed by CORS') {
    logger.security('Blocked CORS request', { origin: req.get('origin'), path: req.path });
    return response.forbidden(res, 'Origin not allowed.');
  }

  const status = err.status || 500;

  if (status >= 500) {
    logger.error('Unhandled error', { message: err.message, stack: err.stack, path: req.path });
    if (env.NODE_ENV === 'development') {
      return response.error(res, err.message, status);
    }
    return response.serverError(res);
  }

  // 4xx errors thrown deliberately (e.g. from fileUpload validation) are
  // safe to show as-is.
  const errors = err.field ? { [err.field]: [err.message] } : undefined;
  return response.error(res, err.message, status, errors);
}

function notFoundHandler(req, res) {
  return response.notFound(res, 'Endpoint not found.');
}

module.exports = { errorHandler, notFoundHandler };
