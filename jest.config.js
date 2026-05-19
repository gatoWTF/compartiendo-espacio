module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  testMatch: ['**/tests/**/*.circuitbreaker.test.js', '**/tests/**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/', 'apps/web/tests/api.test.js'],
  transformIgnorePatterns: [
    '/node_modules/(?!@parkings)'
  ],
};
