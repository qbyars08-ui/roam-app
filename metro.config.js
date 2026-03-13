// =============================================================================
// ROAM — Metro config for web bundle optimization
// =============================================================================
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Web-specific: minimize bundle, enable tree-shaking-friendly resolution
config.resolver = {
  ...config.resolver,
  unstable_enablePackageExports: true,
  unstable_conditionNames: ['require', 'import', 'browser', 'react-native'],
};

// Reduce web bundle: disable source maps in production (handled by expo export)
config.serializer = {
  ...config.serializer,
  getModulesRunBeforeMainModule: () => [],
};

module.exports = config;
