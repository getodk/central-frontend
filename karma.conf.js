/*
This config is based on:

  - https://vue-test-utils.vuejs.org/installation/#using-other-test-runners
  - https://github.com/eddyerburgh/vue-test-utils-karma-example
  - https://github.com/eddyerburgh/avoriaz-karma-mocha-example
  - https://github.com/Nikku/karma-browserify
*/

// eslint-disable-next-line import/no-unresolved
const VueI18nPlugin = require('@intlify/unplugin-vue-i18n/webpack');
const { resolve } = require('node:path');
// eslint-disable-next-line import/extensions
const webpackConfig = require('./node_modules/@vue/cli-service/webpack.config.js');

const { entry, ...webpackConfigForKarma } = webpackConfig;
webpackConfigForKarma.plugins.push(VueI18nPlugin({
  include: resolve(__dirname, './src/locales/**'),
  compositionOnly: false,
  defaultSFCLang: 'json5',
  // `false` doesn't work for some reason. When `false` is specified, Vue I18n
  // warns that it's been installed already.
  fullInstall: true,
  dropMessageCompiler: true
}));
webpackConfigForKarma.devtool = 'inline-source-map';
// See additional warning information.
webpackConfigForKarma.stats = {
  ...webpackConfigForKarma.stats,
  children: true,
  errorDetails: true
};
webpackConfigForKarma.module.rules.push({
  test: /\.xml$/,
  use: 'raw-loader'
});
// This makes karma fail if webpack errors, which seems like it should
// be enabled (and be the default anyway), but causes problems:
//webpackConfigForKarma.optimization.emitOnErrors = false;

module.exports = (config) => {
  config.set({
    frameworks: ['webpack', 'mocha', 'source-map-support'],
    files: [
      'test/index.js',
      { pattern: 'public/fonts/icomoon.ttf', served: true, included: false },
      { pattern: 'public/blank.html', served: true, included: false },
      { pattern: 'test/files/*', served: true, included: false },
      { pattern: 'src/assets/images/**', served: true, included: false }
    ],
    proxies: {
      '/fonts/': '/base/public/fonts/',
      '/blank.html': '/base/public/blank.html',
      '/test/files/': '/base/test/files/',

      // Images
      '/img/banner@1x.2ab8c238.png': '/base/src/assets/images/whats-new/banner@1x.png', // Smaller resolution for circleCI test
      '/img/map-location.b523ce2d.svg': '/base/src/assets/images/geojson-map/map-location.svg',
      '/img/fullscreen.37a932a6.svg': '/base/src/assets/images/geojson-map/fullscreen.svg'
    },
    preprocessors: {
      'test/index.js': ['webpack', 'sourcemap']
    },
    webpack: webpackConfigForKarma,
    browsers: ['ChromeHeadlessNoSandbox'],
    captureTimeout: 60000,

    browserSocketTimeout: 210000,
    browserDisconnectTimeout: 210000,
    browserDisconnectTolerance: 3,
    browserNoActivityTimeout: 210000,

    reporters: ['spec'],
    singleRun: true,
    client: {
      mocha: {
        grep: process.env.TEST_PATTERN || '.',
        timeout: 8000,
      },
    },
    customLaunchers: {
      ChromeDebugging: {
        base: 'Chrome',
        flags: ['--remote-debugging-port=8333']
      },
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox', '--disable-dev-shm-usage'],
      },
    }
  });
};
