module.exports = function (api) {
  api.cache(true);
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
    ],
    env: {
      // Jest runs on plain Node: turn `await import('llama.rn')` etc. into
      // require() so the engine's lazy native-module loads can be mocked.
      test: {
        plugins: ['@babel/plugin-transform-dynamic-import'],
      },
    },
  };
};
