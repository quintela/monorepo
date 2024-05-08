const MalformedRequestBodyError = require('../malformed-request-body-error');
const log = require('@optionq/logger')('error');
const _ = require('lodash');

module.exports.map = e => {
  if (!(e instanceof MalformedRequestBodyError)) {
    return;
  }

  log.error(e.message);

  return {
    body: {
      code: _.snakeCase(e.message),
      message: e.message,
    },
    status: e.status,
  };
};
