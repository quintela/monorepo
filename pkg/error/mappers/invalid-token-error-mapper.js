const InvalidTokenError = require('../invalid-token-error');
const log = require('@optionq/logger')('error');

module.exports = {
  map(e) {
    if (!(e instanceof InvalidTokenError)) {
      return;
    }

    log.error(e.message);

    return {
      body: {
        code: e.name,
        message: e.message,
      },
      headers: e.headers,
      status: e.code,
    };
  },
};
