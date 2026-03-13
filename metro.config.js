// =============================================================================
// ROAM — Metro config for web bundle optimization
// =============================================================================
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const stubVectorIcons = path.resolve(__dirname, 'lib/stub-vector-icons.tsx');

// Web: stub @expo/vector-icons and react-native-vector-icons to cut ~2.5MB
const originalResolve = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const isVectorIcons =
    platform === 'web' &&
    (moduleName === '@expo/vector-icons' ||
      moduleName.startsWith('@expo/vector-icons/') ||
      moduleName === 'react-native-vector-icons' ||
      moduleName.startsWith('react-native-vector-icons/'));
  if (isVectorIcons) {
    return { type: 'sourceFile', filePath: stubVectorIcons };
  }
  return originalResolve
    ? originalResolve(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

// Tree-shaking-friendly resolution
// NOTE: 'import' condition is intentionally excluded — @babel/runtime v7.28+
// exports ESM helpers via the 'import' condition that break Metro's CJS interop
// (ExpoRoot crash: "n is not a function" because ESM helper exports .default
//  but consumer expects CJS module.exports = fn)
config.resolver = {
  ...config.resolver,
  unstable_enablePackageExports: true,
  unstable_conditionNames: ['require', 'browser', 'react-native'],
};

// Reduce web bundle: disable source maps in production (handled by expo export)
config.serializer = {
  ...config.serializer,
  getModulesRunBeforeMainModule: () => [],
};

module.exports = config;
