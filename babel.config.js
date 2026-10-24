module.exports = function (api) {
  // Jest sets JEST_WORKER_ID in every test process (jest-expo's transformer calls Babel
  // as "metro", so the caller name can't be used). Keying on this rather than NODE_ENV
  // keeps the test transform identical on CI, Linux, and a Windows shell that exports
  // NODE_ENV=production for release builds.
  const isJest = !!process.env.JEST_WORKER_ID;
  api.cache.using(() => isJest);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './app',
          },
        },
      ],
      // Jest runs on plain Node: turn `await import('llama.rn')` etc. into require()
      // so the engine's lazy native-module loads can be mocked.
      ...(isJest ? ['@babel/plugin-transform-dynamic-import'] : []),
    ],
  };
};
