const log = require('@optionq/logger')('request-middleware');
const geoip = require('geoip-lite');
const _ = require('lodash');
const parser = require('ua-parser-js');

module.exports = () => {
  return async (context, next) => {
    const country = _.toUpper(context.headers['geoip-country-code']);

    const geo = geoip.lookup(context.ip);
    const { device, os } = parser(context.headers['user-agent']);

    context.meta = {
      device,
      geo,
      ip: context.ip,
      os,
    };

    const ua = _.truncate(
      `${context.headers['user-agent']}`, { length: 1024 }
    );

    context.state.request = {
      country: _.includes(['XX', ''], country) ? null : country,
      id: context.state.id,
      ip: context.ip,
      userAgent: context.headers['user-agent'] ? ua : null,
    };

    log.debug(
      {
        request: _.defaults(
          { id: context.state.id, ip: context.ip },
          context.request.toJSON(),
        ),
      },
      `Request to ${context.request.method} ${context.request.url}`,
    );

    await next();
  };
};
