/*
Copyright 2019 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
module.exports = {
  chainWebpack: (config) => {
    // We don't want to prefetch all locale files.
    config.plugins.delete('prefetch');

    // Set VUE_APP_RESOLVE_SYMLINKS to `false` if you use symlinks in
    // development: vue-cli-plugin-i18n doesn't seem to play well with symlinks.
    // You can set VUE_APP_RESOLVE_SYMLINKS in a file named .env.local. See
    // also:
    // https://cli.vuejs.org/guide/troubleshooting.html#symbolic-links-in-node-modules
    if (process.env.VUE_APP_RESOLVE_SYMLINKS === 'false')
      config.resolve.symlinks(false);

    if (process.env.NODE_ENV === 'test') {
      config.resolve.alias.set('vue$', 'vue/dist/vue.esm-bundler.js');
    }
  },
  css: {
    loaderOptions: {
      css: { url: false }
    }
  },
  lintOnSave: false,
  pluginOptions: {
    i18n: {
      locale: 'en',
      fallbackLocale: 'en',
      localeDir: 'locales',
      enableLegacy: true,
      runtimeOnly: process.env.NODE_ENV !== 'test',
      fullInstall: false
    }
  }
};
