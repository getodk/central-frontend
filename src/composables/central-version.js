/*
Copyright 2024 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import { F } from 'ramda';
import { watchEffect, watchSyncEffect } from 'vue';

import useCallWait from './call-wait';
import { memoizeForContainer } from '../util/composable';
import { useRequestData } from '../request-data';

export default memoizeForContainer(({ i18n, alert, config }) => {
  const { createResource } = useRequestData();
  const centralVersion = createResource('centralVersion');
  watchSyncEffect(() => {
    if (!config.dataExists) return;
    const versionText = config.centralVersion;
    if (versionText == null) return;
    centralVersion.data = {
      versionText,
      currentVersion: versionText.match(/\(v(\d{4}[^-]*)/)[1],
      currentDate: config.currentDate
    };
  });

  // Check for a change to /version.txt.
  const latestVersion = createResource('latestVersion');
  const { callWait } = useCallWait();
  // Alerts the user about a version change, then keep alerting them. One
  // benefit of this approach is that the user should see the alert even if
  // there is another alert (say, about session expiration).
  const alertAboutChange = () => {
    callWait(
      'centralVersion.alert',
      () => { alert.info(i18n.t('alert.versionChange')); },
      (count) => (count === 0 ? 0 : 60000)
    );
  };
  watchEffect(() => {
    if (!centralVersion.dataExists) return;
    callWait(
      'centralVersion.check',
      () => latestVersion.request({ url: '/version.txt', alert: false })
        .then(() => {
          if (latestVersion.data === centralVersion.versionText) return false;
          alertAboutChange();
          return true;
        })
        .catch(F),
      () => 60000
    );
  });

  return centralVersion;
});
