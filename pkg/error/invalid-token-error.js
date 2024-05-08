const HttpError = require('standard-http-error');

class InvalidTokenError extends HttpError {
  constructor(properties) {
    super(400, 'Invalid Token', properties);
  }
}

module.exports = InvalidTokenError;
