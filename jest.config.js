module.exports = {
  preset: 'jest-expo/ios',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@supabase/.*|zustand)',
  ],
  setupFiles: ['<rootDir>/jest.setup.js'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  testMatch: ['**/__tests__/**/*.(ts|tsx)', '**/*.(test|spec).(ts|tsx)'],
  collectCoverageFrom: [
    'lib/**/*.{ts,tsx}',
    '!lib/**/*.d.ts',
    '!lib/stub-*.{ts,tsx}',
  ],
  moduleNameMapper: {
    '^expo-haptics$': '<rootDir>/lib/haptics.ts',
    '^react-native-view-shot$': '<rootDir>/lib/view-shot.ts',
    // Bypass Expo winter runtime that conflicts with Jest
    '^expo/src/winter/(.*)$': '<rootDir>/jest.expo-winter-mock.js',
  },
  globals: {
    __ExpoImportMetaRegistry: {},
  },
};
