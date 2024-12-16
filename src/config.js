/*
Copyright 2021 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/

// These are the default config values. They will be merged with the response
// for /client-config.json.
export default {
  // `true` to allow navigation to /system/analytics and `false` not to.
  showsAnalytics: true,
  home: {
    title: null,
    body: null
  },
  // VUE_APP_OIDC_ENABLED is not set in production. It can be set during local
  // development to facilitate work on SSO.
  oidcEnabled: process.env.VUE_APP_OIDC_ENABLED === 'true',
  showsFeedbackButton: false,
  // `true` to show additional buttons to facilitate development and testing.
  devTools: false
};
