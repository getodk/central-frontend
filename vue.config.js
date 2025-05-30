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
if (process.env.NODE_ENV !== 'test')
  throw new Error('Vue CLI is only intended for use in testing. For production and development, use Vite.');

module.exports = {
  chainWebpack: (config) => {
    // We don't want to prefetch all locale files.
    config.plugins.delete('prefetch');

    config.resolve.alias.set('vue$', 'vue/dist/vue.esm-bundler.js');
  },
  css: {
    loaderOptions: {
      css: { url: false }
    }
  }
};
