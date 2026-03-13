// =============================================================================
// ROAM — Metro config for web bundle optimization
// =============================================================================
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const stubVectorIcons = path.resolve(__dirname, 'lib/stub-vector-icons');

// Web: stub @expo/vector-icons to cut ~2.5MB (Ionicons, FontAwesome, MaterialCommunityIcons)
const defaultResolve = config.resolver.resolveRequest?.bind(config.resolver);
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && (moduleName === '@expo/vector-icons' || moduleName.startsWith('@expo/vector-icons/'))) {
    return { type: 'sourceFile', filePath: stubVectorIcons };
  }
  return defaultResolve
    ? defaultResolve(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

// Tree-shaking-friendly resolution
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
