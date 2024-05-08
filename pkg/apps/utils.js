const _ = require('lodash');

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

const unimplemented = (depth = 1) => {
  const { stack } = new Error();

  const { groups } = /^at (?<caller>[^(]+) \(.+$/.exec(
    _.trim(stack.split('\n')[_.parseInt(depth)]),
  );

  throw new Error(
    `FATAL: Please implement method '${groups.caller}' \
in class '${this.constructor.name}'`,
  );
};

module.exports = {
  promisify,
  unimplemented,
};
