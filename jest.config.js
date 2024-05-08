module.exports = {
  bail: false,
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: ['<rootDir>/pkg/**/*.js'],
  coverageDirectory: '<rootDir>/coverage/',
  coverageReporters: ['json-summary', 'text', 'lcov'],
  coverageThreshold: {
    global: {
      branches: 25,
      functions: 30,
      lines: 30,
      statements: 30,
    },
  },
  globals: {
    __DEV__: true,
  },
  modulePaths: ['<rootDir>'],
  restoreMocks: true,
  rootDir: './',
  setupFilesAfterEnv: [
    '<rootDir>/test/setup.js',
  ],
  testEnvironment: 'node',
  testRegex: [
    'pkg/apps/test/.*\\.test.js$',
    'pkg/error/test/.*\\.test.js$',
    'pkg/eslint-config/test/.*\\.test.js$',
    'pkg/logger/test/.*\\.test.js$',
    'pkg/middleware/test/.*\\.test.js$',
    'pkg/process-manager/test/.*\\.test.js$',
    'pkg/redis-client/test/.*\\.test.js$',
    'pkg/transport/test/.*\\.test.js$',
  ],
  verbose: true,
};
