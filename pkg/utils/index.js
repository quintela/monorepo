const { CustomError } = require('@optionq/error');
const _ = require('lodash');
const validUrl = require('valid-url');

const promisify = fn => (...args) =>
  new Promise((resolve, reject) => {
    fn(...args, (error, value) => {
      if (error) {
        reject(error);

        return;
      }
      resolve(value);
    });
  });

function throwIfInvalidUrl(url) {
  try {
    if (!validUrl.isUri(url)) {
      throw new CustomError('Invalid Url');
    }
  } catch (err) {
    throw new CustomError('Invalid Url');
  }
}

function throwIfMissing(param, name) {
  if (!param) {
    throw new CustomError(`Missing ${name}`);
  }
}

function unimplemented(depth = 1) {
  const { stack } = new Error();

  const { groups } = /^at (?<caller>[^(]+) \(.+$/.exec(
    _.trim(stack.split('\n')[_.parseInt(depth)]),
  );

  throw new Error(
    `FATAL: Please implement method '${groups.caller}' \
in class '${this.constructor.name}'`,
  );
}

module.exports = { promisify, throwIfInvalidUrl, throwIfMissing, unimplemented };
