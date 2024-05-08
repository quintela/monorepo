const processManager = require('@optionq/process-manager');
const config = require('config');
const Redis = require('ioredis');
const { defaults, memoize } = require('lodash');

const { name } = process.env;

const create = memoize((log, opts = {}) => {
  let ns = '';

  if (opts.ns) {
    ns = `${opts.ns}.`;
  }

  let options = {
    connectionName: opts.connectionName || name,
  };

  let maximumRetries = 3;

  if (config.has(`${ns}redis.options`)) {
    options = defaults(options, config.get(`${ns}redis.options`));
  }

  if (config.has(`${ns}redis.maxRetries`)) {
    maximumRetries = config.get(`${ns}redis.maxRetries`);
  }

  function retryStrategy(times) {
    if (times > maximumRetries) {
      log.warn(
        { retries: maximumRetries },
        'Exceeded maximum connection retry times',
      );

      return false;
    }

    // Exponential back-off ([20, 40, 80, 160, 320, 640, 1280, 2560, 5120, ...]).
    return Math.min(2 ** times * 10, 5000);
  }

  const client = new Redis(
    defaults(
      {
        retryStrategy,
        sentinelRetryStrategy: retryStrategy,
      },
      options,
    ),
  );

  client.on('end', () => {
    if (client.retryAttempts > maximumRetries) {
      throw new Error('Exceeded maximum connection retry times');
    }
  });

  client.on('error', error => log.error(error));

  processManager.addHook({
    handler: () => {
      if (client.status === 'reconnecting') {
        return client.disconnect();
      }

      if (client.status !== 'end') {
        return client.quit();
      }
    },
    name: 'redis',
    type: 'disconnect',
  });

  return client;
});

module.exports = { create };
