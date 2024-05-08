const log = require('@optionq/logger')('error');
const { snakeCase } = require('lodash');
const HttpError = require('standard-http-error');
const STATUS_CODE_TO_NAME = require('http').STATUS_CODES;

module.exports.map = e => {
  if (!(e instanceof HttpError)) {
    return;
  }

  log.error(e.message);

  return {
    body: {
      code: snakeCase(STATUS_CODE_TO_NAME[e.code]),
      message: STATUS_CODE_TO_NAME[e.code],
    },
    headers: e.headers,
    status: e.code,
  };
};
