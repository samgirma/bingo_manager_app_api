const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Add aliases to replace native-only modules with web shims
  config.resolve = config.resolve || {};
  config.resolve.alias = Object.assign({}, config.resolve.alias, {
    'expo-haptics': path.resolve(__dirname, 'web-shims', 'expo-haptics.js'),
    'expo-image-picker': path.resolve(__dirname, 'web-shims', 'expo-image-picker.js'),
    'expo-sharing': path.resolve(__dirname, 'web-shims', 'expo-sharing.js'),
    'expo-secure-store': path.resolve(__dirname, 'web-shims', 'expo-secure-store.js'),
    'expo-file-system': path.resolve(__dirname, 'web-shims', 'expo-file-system.js'),
    'expo-file-system/legacy': path.resolve(__dirname, 'web-shims', 'expo-file-system-legacy.js'),
  });

  return config;
};
