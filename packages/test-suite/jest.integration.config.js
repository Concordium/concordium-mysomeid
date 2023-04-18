/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  "testTimeout": 60000,
  bail: true,
  silent: false,
  verbose: true,
  passWithNoTests: true,
  useStderr: true,
  testMatch: [
    '**/integration/**/*.test.ts',
  ],
};
