const HttpError = require('standard-http-error');

class CustomError extends HttpError {
  constructor(e) {
    super(400, e.message, e);
  }
}

module.exports = CustomError;
