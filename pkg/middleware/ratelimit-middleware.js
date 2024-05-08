const logger = require('@optionq/logger');
const redis = require('@optionq/redis-client');
const config = require('config');
const ratelimit = require('koa-ratelimit');
const _ = require('lodash');

const ips
  = config.has('ratelimit.custom.whitelist')
    && config.get('ratelimit.custom.whitelist')
  || [];

const ratelimitMiddleware = {};

ratelimitMiddleware.middleware = (options, opts) => {
  const redisLogger = logger('ratelimit', {}, { prefix: 'ratelimit' });

  options = _.defaults(
    {
      db: redis.create(redisLogger, opts),
      headers: {
        remaining: 'Rate-Limit-Remaining',
        reset: 'Rate-Limit-Reset',
        total: 'Rate-Limit-Total',
      },
      throw: true,
    },
    options,
  );

  return async function ratelimiter(context, next) {
    if (_.includes(ips, context.ip)) {
      return await ratelimit(
        _.defaults(
          config.get('ratelimit.custom.ip'),
          {
            id(context) {
              return `global:ip:${context.ip}`;
            },
          },
          options,
        ),
      )(context, next);
    }

    return await ratelimit(options)(context, next);
  };
};

ratelimitMiddleware.global = () => {
  return ratelimitMiddleware.middleware(
    _.defaults(config.get('ratelimit.global.ip'), {
      id(context) {
        return `global:ip:${context.ip}`;
      },
    }),
    config.get('ratelimit.redis'),
  );
};

module.exports = ratelimitMiddleware;
