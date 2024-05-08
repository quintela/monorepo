const MalformedRequestBodyError = require('../malformed-request-body-error');
const mapper = require('../mappers/malformed-request-body-error-mapper');
const Koa = require('koa');
const errorHandler = require('koa-error-mapper');
const _ = require('lodash');
const supertest = require('test/util/request')();

describe('MalformedRequestBodyErrorMapper', () => {
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

  it('should return if error is not an instance of `MalformedRequestBodyError`', () => {
    expect(_.map(mapper, new Error())).toBeUndefined();
  });

  it('should return mapping', () => {
    const mapping = _.map(mapper, new MalformedRequestBodyError());

    expect(mapping).toEqual({
      body: {
        code: 'malformed_request_body',
        message: 'Malformed Request Body',
      },
      status: 400,
    });
  });

  it('should return `code` and `message`', () => {
    app.use(errorHandler([mapper]));
    app.use(() => {
      throw new MalformedRequestBodyError();
    });

    agent.get('/').expect(({ status, text }) => {
      expect(status).toBe(400);
      expect(JSON.parse(text)).toEqual({
        code: 'malformed_request_body',
        message: 'Malformed Request Body',
      });
    });
  });
});
