module.exports = {
  testEnvironment: 'node',
  // Polyfill WebSocket before any module loads so @supabase/realtime-js
  // can instantiate without throwing on Node < 22 or in Jest sandboxes.
  setupFiles: ['./jest.setup.js'],
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  testMatch: ['**/tests/**/*.circuitbreaker.test.js', '**/tests/**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/', 'apps/web/tests/api.test.js'],
  transformIgnorePatterns: [
    '/node_modules/(?!@parkings)'
  ],
};
