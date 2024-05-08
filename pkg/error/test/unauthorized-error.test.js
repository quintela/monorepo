const UnauthorizedError = require('../unauthorized-error');

describe('UnauthorizedError', () => {
  it('should return `code` and `message`', () => {
    const error = new UnauthorizedError();

    expect(error.code).toEqual(401);
    expect(error.message).toEqual('Unauthorized');
  });
});
