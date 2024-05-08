const { InvalidTokenError } = require('@optionq/error');

module.exports = () => {
  return async function authentication(ctx, next) {
    if (ctx.useAuthentication && !ctx.auth.isValidToken(ctx.req)) {
      throw new InvalidTokenError(`Invalid authentication token`);
    }

    await next();
  };
};
