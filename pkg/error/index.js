const CustomError = require('./custom-error');
const InvalidTokenError = require('./invalid-token-error');
const MalformedRequestBodyError = require('./malformed-request-body-error');
const customErrorMapper = require('./mappers/custom-error-mapper');
const httpErrorMapper = require('./mappers/http-error-mapper');
const invalidTokenErrorMapper = require(
  './mappers/invalid-token-error-mapper'
);
const malformedReqErrorMapper = require(
  './mappers/malformed-request-body-error-mapper'
);
const UnauthorizedError = require('./unauthorized-error');

module.exports = {
  CustomError,
  InvalidTokenError,
  MalformedRequestBodyError,
  UnauthorizedError,
  mappers: {
    customErrorMapper,
    httpErrorMapper,
    invalidTokenErrorMapper,
    malformedReqErrorMapper,
  },
};
