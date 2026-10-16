'use strict';

/**
 * Legacy responses use { success, message, data } (or "errors" on 422),
 * matching the shape the frontend's RTK Query layer already expects
 * (`transformResponse: (response) => response.data` in
 * src/redux/housebank.ts). contractError provides the categorized
 * failure shape for endpoints adopting the shared error contract.
 */
function success(res, data = null, message = 'OK', status = 200) {
  return res.status(status).json({ success: true, message, data });
}

function created(res, data = null, message = 'Created') {
  return success(res, data, message, 201);
}

function error(res, message, status = 400, errors = null) {
  const payload = { success: false, message };
  if (errors) payload.errors = errors;
  return res.status(status).json(payload);
}

function contractError(res, category, message, status, fields = null) {
  return res.status(status).json({ success: false, category, message, fields });
}

module.exports = {
  success,
  created,
  error,
  contractError,
  unauthorized: (res, message = 'Unauthorized.') => error(res, message, 401),
  forbidden: (res, message = 'Forbidden.') => error(res, message, 403),
  notFound: (res, message = 'Not found.') => error(res, message, 404),
  validationError: (res, errors, message = 'Validation failed.') => error(res, message, 422, errors),
  tooManyRequests: (res, message = 'Too many requests. Please try again later.') => error(res, message, 429),
  serverError: (res, message = 'Something went wrong. Please try again.') => error(res, message, 500),
};
