const { MalformedRequestBodyError } = require('@optionq/error');
const { mappers } = require('@optionq/error');
const { requestLifecycle } = require('@optionq/middleware');
const Koa = require('koa');
const bodyparser = require('koa-bodyparser');
const errorMapper = require('koa-error-mapper');
const helmet = require('koa-helmet');
const requestId = require('koa-requestid');
const _ = require('lodash');

const {
  customErrorMapper,
  httpErrorMapper,
  invalidTokenErrorMapper,
  malformedRequestBodyErrorMapper: malformedBodyErrorMapper,
} = mappers;

module.exports = (
  appName,
  routers,
  ctx = {},
  { appMiddlewares = [], appErrorMappers = [] } = {},
) => {
  const app = new Koa();

  // expand Koa context with appContext
  app.use(async (context, next) => {
    _.assign(context, ctx);
    await next();
  });

  // Trust reverse proxy.
  app.proxy = true;

  // Request lifecycle.
  app.use(
    requestLifecycle({
      application: appName,
      routers,
    }),
  );

  // Enable CSP.
  app.use(
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ['"none"'],
      },
    }),
  );

  // Enable HSTS.
  app.use(
    helmet.hsts({
      maxAge: 31536000,
    }),
  );

  // Enable X-XSS-Protection.
  app.use(helmet.xssFilter());

  // Disable content type sniffing.
  app.use(helmet.noSniff());

  // Deny framing.
  app.use(
    helmet.frameguard({
      action: 'deny',
    }),
  );

  // Expose request id on the deployer application context.
  app.use(
    requestId({
      expose: 'Request-Id',
      header: 'Request-Id',
    }),
  );

  // Error handlers.
  app.use(
    errorMapper([
      invalidTokenErrorMapper,
      customErrorMapper,
      httpErrorMapper,
      malformedBodyErrorMapper,
      ...appErrorMappers,
    ]),
  );

  const invalidJsonMsg = 'invalid JSON, only supports object and array';

  // Add body parser.
  app.use(
    bodyparser({
      onerror(e, context) {
        if (!(e instanceof SyntaxError) && e.message !== invalidJsonMsg) {
          throw e;
        }

        throw new MalformedRequestBodyError({
          mime: context.header['content-type'],
        });
      },
    }),
  );

  _.forEach(appMiddlewares, middleware => app.use(middleware()));

  return app;
};
