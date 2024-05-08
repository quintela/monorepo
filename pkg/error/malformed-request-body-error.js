const HttpError = require('standard-http-error');

class MalformedRequestBodyError extends HttpError {
  constructor(properties) {
    super(400, 'Malformed Request Body', properties);
  }
}

module.exports = MalformedRequestBodyError;
