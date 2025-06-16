/*
Copyright 2025 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/

/*
createAlert() creates an alert. There are currently two alerts in Frontend.

`toast` is an alert that is used to show success messages and info messages. It
is shown on the bottom of the screen.

redAlert is used to show error messages. If there is an error message, and a
modal is open, the error message will be shown at the top of the modal. If no
modal is open, it will be shown on the bottom of the screen.

createAlerts() creates `toast` and `redAlert`. It also returns an `alert` object
that can be used to show either `toast` or `redAlert`. `alert` defers to `toast`
or `redAlert` based on the type of alert (success, info, or error/"danger").
`alert` also provides access to the latest alert to be shown.
*/

import { createAlert } from '../alert';

export default () => {
  const toast = createAlert();
  const redAlert = createAlert({ autoHide: false });

  const alert = {
    get last() {
      if (toast.at > redAlert.at) return toast;
      if (toast.at < redAlert.at) return redAlert;
      return !toast.state && redAlert.state ? redAlert : toast;
    },

    get type() {
      return this.last === redAlert
        ? 'danger'
        : (toast.options.autoHide ? 'success' : 'info');
    },

    success: (message) => toast.show(message),
    info: (message) => toast.show(message, { autoHide: false }),
    danger: (message) => redAlert.show(message)

    // There is intentionally no hide() method. It's not clear what the behavior
    // of a hide() method would be. Should it hide both alerts or just the
    // latest one? Different cases require different things.
  };
  for (const prop of ['state', 'messageId', 'message', 'at', 'cta']) {
    Object.defineProperty(alert, prop, {
      get() { return this.last[prop]; }
    });
  }

  return { toast, redAlert, alert };
};
