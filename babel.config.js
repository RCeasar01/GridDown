module.exports = function (api) {
  // jest-expo calls Babel with caller { name: 'metro', bundler: 'jest' }; the real Metro
  // bundler passes bundler: 'metro'. (NODE_ENV can't be used — the PC build shell exports
  // NODE_ENV=production — and JEST_WORKER_ID can't either: Metro's transform workers are
  // spawned by jest-worker, which sets it in every child.)
  const isJest = api.caller((caller) => !!caller && caller.bundler === 'jest');
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
