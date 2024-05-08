const InvalidTokenErrorError = require('../invalid-token-error');
const mapper = require('../mappers/invalid-token-error-mapper');
const Koa = require('koa');
const errorHandler = require('koa-error-mapper');
const _ = require('lodash');
const supertest = require('test/util/request')();

describe('InvalidTokenErrorMapper', () => {
  let agent;

  const app = new Koa();

  let server;

  beforeAll(async done => {
    server = await app.listen(4004, () => {
      agent = supertest(server);
      done();
    });
  });

  afterAll(async () => {
    await server.close();
  });

  it('should return if error is not an instance of `InvalidTokenErrorError`', () => {
    expect(_.map(mapper, new Error())).toBeUndefined();
  });

  it('should return mapping', () => {
    const mapping = _.map(mapper, new InvalidTokenErrorError());

    expect(mapping).toEqual({
      body: {
        code: 'InvalidTokenError',
        message: 'Invalid Token',
      },
      status: 400,
    });
  });

  it('should return `code` and `message`', () => {
    app.use(errorHandler([mapper]));
    app.use(() => {
      throw new InvalidTokenErrorError();
    });

    agent.get('/').expect(({ status, text }) => {
      expect(status).toBe(400);
      expect(JSON.parse(text)).toEqual({
        code: 'InvalidTokenError',
        message: 'Invalid Token',
      });
    });
  });
});
