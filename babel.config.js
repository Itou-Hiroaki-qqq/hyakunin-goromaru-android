module.exports = function (api) {
  api.cache(true);

  const plugins = [];

  // 本番ビルドではconsole.*を除去してパフォーマンス向上
  if (process.env.NODE_ENV === 'production') {
    plugins.push('transform-remove-console');
  }

  return {
    presets: ['babel-preset-expo'],
    plugins,
  };
};
