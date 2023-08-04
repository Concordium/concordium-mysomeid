/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  collectCoverageFrom: ['src-*/**/*.test.ts'],
  coverageDirectory: 'coverage',
  roots: ['<rootDir>/src-content'],
  testMatch: ['**/src-*/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: './tsconfig-tests.json' }]
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  verbose: true,
};
