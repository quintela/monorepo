const _ = require('lodash');
const os = require('os');

module.exports = ({ application, routers } = {}) => {
  if (!application) {
    throw new Error('Please specify `options.application`');
  }

  if (!routers) {
    throw new Error('Please specify `options.routers`');
  }

  return async function requestLifecycle(ctx, next) {
    const createdAt = new Date();
    const hostname = os.hostname();

    ctx.response.startedAt = process.hrtime();

    // renewed ctx uuid
    ctx.logger.info({ payload: ctx.request.body }, 'New Request received');

    await next();

    let matchedRoutes = ctx.matched;

    if (!matchedRoutes) {
      matchedRoutes = _.flatMap(routers, router =>
        _.get(router.match(ctx.path, ctx.method), 'path'),
      );
    }

    const diff = process.hrtime(ctx.response.startedAt);
    const route = _.get(
      _.find(matchedRoutes, { methods: [ctx.request.method] }),
      'name',
    );
    const data = {
      request: _.defaults(
        {
          createdAt,
          id: ctx.state.id,
          ip: ctx.ip,
          route,
          uuid: ctx.uuid,
        },
        ctx.request.toJSON(),
      ),
      response: {
        duration: diff[0] * 1000 + diff[1] / 1000000,
        status: ctx.response.status,
      },
      server: {
        hostname,
      },
    };

    ctx.logger.debug(
      { data },
      `Response to ${ctx.request.method} ${ctx.request.url}`,
    );
  };
};
