// ported from https://www.npmjs.com/package/debugnyan
const bunyan = require('bunyan');
const debug = require('debug');
const _ = require('lodash');
const loggers = Object.create(null);
const level = bunyan.FATAL + 1;

module.exports = (
  name,
  options,
  { prefix = 'sub', simple = true, suffix = 'component' } = {},
) => {
  const components = name.split(':');
  const [root] = components;

  if (!loggers[`${root}`]) {
    loggers[`${root}`] = bunyan.createLogger(
      _.assign({}, options, { level, name: root }),
    );
  }

  let child = loggers[`${root}`];

  for (let i = 1; i < components.length; i++) {
    const current = components[Number.parseInt(i, 10)];
    const next = loggers[`${components.slice(0, i).join(':')}`];
    const childName = components.slice(0, i + 1).join(':');

    if (loggers[`${childName}`]) {
      child = loggers[`${childName}`];
      continue;
    }
    options = _.assign({}, options, {
      [`${_.repeat(prefix, i - 1)}${suffix}`]: current,
      level,
    });
    child = next.child(options, simple);
    loggers[`${childName}`] = child;
  }
  if (debug.enabled(name)) {
    child.level(bunyan.DEBUG);
  }

  return loggers[`${name}`];
};
