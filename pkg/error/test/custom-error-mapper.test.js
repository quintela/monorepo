const CustomError = require('../custom-error');
const mapper = require('../mappers/custom-error-mapper');
const Koa = require('koa');
const errorHandler = require('koa-error-mapper');
const _ = require('lodash');
const supertest = require('test/util/request')();

describe('CustomErrorMapper', () => {
  let agent;

  const app = new Koa();

  let server;

  beforeAll(() => {
    server = new Promise(app.listen(4004, () => {
      agent = supertest(server);
      // done();
    }));
  });

  afterAll(async () => {
    await server.close();
  });

  it('should return if error is not an instance of `CustomError`', () => {
    expect(_.map(mapper, new Error())).toBeUndefined();
  });

  it('should return mapping', () => {
    const mapping = _.map(mapper, new CustomError({ message: 'Foo' }));

    expect(mapping).toMatchObject({
      body: {
        code: 'CustomError',
        message: 'Foo',
      },
      status: 400,
    });
  });

  it('should return `code` and `message`', () => {
    app.use(errorHandler([mapper]));
    app.use(() => {
      throw new CustomError({ message: 'Foo' });
    });

    agent.get('/').expect(({ status, text }) => {
      expect(status).toBe(400);
      expect(JSON.parse(text)).toEqual({
        code: 'CustomError',
        message: 'Foo',
      });
    });
  });
});
