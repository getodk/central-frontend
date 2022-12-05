/*
This config is based on:

  - https://vue-test-utils.vuejs.org/installation/#using-other-test-runners
  - https://github.com/eddyerburgh/vue-test-utils-karma-example
  - https://github.com/eddyerburgh/avoriaz-karma-mocha-example
  - https://github.com/Nikku/karma-browserify
*/

// eslint-disable-next-line import/extensions
const webpackConfig = require('./node_modules/@vue/cli-service/webpack.config.js');

const { entry, ...webpackConfigForKarma } = webpackConfig;
webpackConfigForKarma.devtool = 'inline-source-map';
// See additional warning information.
webpackConfigForKarma.stats = {
  ...webpackConfigForKarma.stats,
  children: true,
  errorDetails: true
};

module.exports = (config) => {
  config.set({
    frameworks: ['webpack', 'mocha'],
    files: [
      'test/index.js',
      { pattern: 'public/fonts/icomoon.ttf', served: true, included: false },
      { pattern: 'public/blank.html', served: true, included: false },
      { pattern: 'test/files/*', served: true, included: false }
    ],
    proxies: {
      '/fonts/': '/base/public/fonts/',
      '/blank.html': '/base/public/blank.html',
      '/v1/backup': '/base/public/blank.html',
      '/test/files/': '/base/test/files/'
    },
    preprocessors: {
      'test/index.js': ['webpack', 'sourcemap']
    },
    webpack: webpackConfigForKarma,
    browsers: ['ChromeHeadless'],
    reporters: ['spec'],
    singleRun: true,
    customLaunchers: {
      ChromeDebugging: {
        base: 'Chrome',
        flags: ['--remote-debugging-port=8333']
      }
    }
  });
};
