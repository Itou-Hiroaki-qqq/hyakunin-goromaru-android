/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFiles: [
    '<rootDir>/__tests__/setup/mocks.ts',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^~/(.*)$': '<rootDir>/$1',
    // expo/src/winter がimport.metaを使うためモックする
    '^expo/src/winter$': '<rootDir>/__tests__/setup/expoWinterMock.js',
    '^expo/src/winter/(.*)$': '<rootDir>/__tests__/setup/expoWinterMock.js',
  },
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|zustand)',
  ],
};
