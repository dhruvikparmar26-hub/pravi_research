// ──────────────────────────────────────────────
// Pravi — Standard API Response Helpers
// Every controller should use these so the
// frontend always receives a predictable shape.
// ──────────────────────────────────────────────

/**
 * Send a success response.
 *
 * @param {object} res     Express response object
 * @param {number} status  HTTP status code (200, 201, etc.)
 * @param {string} message Human-readable success message
 * @param {*}      data    Payload (object, array, or null)
 */
const sendSuccess = (res, status, message, data = null) => {
  const body = { success: true, message };
  if (data !== null) body.data = data;
  return res.status(status).json(body);
};

/**
 * Send an error response.
 *
 * @param {object} res     Express response object
 * @param {number} status  HTTP status code (400, 401, 403, 404, 500, etc.)
 * @param {string} message Human-readable error message
 * @param {*}      errors  Optional validation errors or details
 */
const sendError = (res, status, message, errors = null) => {
  const body = { success: false, message };
  if (errors !== null) body.errors = errors;
  return res.status(status).json(body);
};

module.exports = { sendSuccess, sendError };
