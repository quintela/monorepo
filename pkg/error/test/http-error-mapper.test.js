const mapper = require('../mappers/http-error-mapper');
const _ = require('lodash');
const HttpError = require('standard-http-error');

describe('HttpErrorMapper', () => {
  it('should return empty if error is not an instance of `HttpError`', () => {
    expect(_.map(mapper, new Error())).toBeUndefined();
  });

  it('should not return error properties', () => {
    const error = new HttpError(503, { foo: 'bar' });
    const mapping = _.map(mapper, error);

    expect(error).toHaveProperty('message', 'Service Unavailable');
    expect(error).toHaveProperty('foo', 'bar');
    expect(error).toHaveProperty('name', 'HttpError');
    expect(error).toHaveProperty('code', 503);
    expect(mapping).toMatchObject({
      body: {
        code: 'service_unavailable',
        message: 'Service Unavailable',
      },
      headers: undefined,
      status: 503,
    });
  });

  it('should return standard http mapping if only status code is set', () => {
    const mapping = _.map(mapper, new HttpError(503));

    expect(mapping).toHaveProperty('status', 503);
    expect(mapping).toHaveProperty('body.code', 'service_unavailable');
    expect(mapping).toHaveProperty('body.message', 'Service Unavailable');
    expect(mapping).toHaveProperty('headers', undefined);
  });

  it('should return mapping ignoring custom message if status code and message are set', () => {
    const mapping = _.map(mapper, new HttpError(503, 'Foo'));

    expect(mapping).toHaveProperty('status', 503);
    expect(mapping).toHaveProperty('body.code', 'service_unavailable');
    expect(mapping).toHaveProperty('body.message', 'Service Unavailable');
    expect(mapping).toHaveProperty('headers', undefined);
  });
});
