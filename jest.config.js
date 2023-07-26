/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-jsdom',
  transform: {},
  moduleNameMapper: {
    '\\.(css|less)$': '<rootDir>/test/jest/__mocks__/styleMock.js',
  }
};
