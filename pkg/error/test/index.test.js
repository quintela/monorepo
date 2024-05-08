const idx = require('../index.js');

describe('*index*', () => {
  it('should export `CustomError`', () => {
    expect(idx.CustomError).toBeDefined();
  });
  it('should export `InvalidTokenError`', () => {
    expect(idx.InvalidTokenError).toBeDefined();
  });
  it('should export `MalformedRequestBodyError`', () => {
    expect(idx.MalformedRequestBodyError).toBeDefined();
  });
  it('should export `mappers`', () => {
    expect(idx.mappers).toBeDefined();
  });
});
