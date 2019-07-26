/*
This config is based on:

  - https://github.com/Nikku/karma-browserify
  - https://github.com/eddyerburgh/vue-test-utils-karma-example
  - https://github.com/eddyerburgh/avoriaz-karma-mocha-example
*/

const webpackConfig = require('./node_modules/@vue/cli-service/webpack.config.js');

const { entry, ...configForTests } = webpackConfig;
configForTests.devtool = 'inline-source-map';

module.exports = function(config) {
  config.set({
    frameworks: ['mocha'],
    files: [
      'test/index.js',
      { pattern: 'public/fonts/icomoon.ttf', served: true, included: false },
      { pattern: 'public/blank.html', served: true, included: false },
      { pattern: 'test/files/*', served: true, included: false }
    ],
    proxies: {
      '/fonts/': '/base/public/fonts/',
      '/blank.html': '/base/public/blank.html',
      '/test/files/': '/base/test/files/'
    },
    preprocessors: {
      'test/index.js': ['webpack', 'sourcemap']
    },
    webpack: configForTests,
    browsers: ['ChromeHeadless'],
    reporters: ['spec'],
    singleRun: true
  });
};
