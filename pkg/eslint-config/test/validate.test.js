const eslint = require('eslint');
const _ = require('lodash');
const fs = require('fs');

function getErrors(configFile, fileToTest) {
  const { CLIEngine } = eslint;

  const cli = new CLIEngine({
    configFile,
  });

  return cli.executeOnText(fs.readFileSync(fileToTest, 'utf8'));
}

describe('Validate ESLint configs', () => {
  _.forEach(['pkg/eslint-config/src/index.js'], file => {
    it(`load config ${file} in ESLint to validate all rules are correct`, () => {
      expect(
        getErrors(file, 'pkg/eslint-config/src/index.js').results[0].messages
      ).toEqual([]);
    });
  });
});
