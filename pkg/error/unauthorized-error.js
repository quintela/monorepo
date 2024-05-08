const HttpError = require('standard-http-error');

class UnauthorizedError extends HttpError {
  constructor(properties) {
    super(401, 'Unauthorized', properties);
  }
}

module.exports = UnauthorizedError;
