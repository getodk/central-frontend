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
createAlert() creates an alert object. There are currently two alerts in
Frontend.

`toast` is an alert that is shown on the bottom of the screen. It has a neutral
background color and is used to convey a variety of information. It is rendered
in the Toast component, which is rendered in the Alerts component.

`redAlert` is an alert that is used specifically to show error messages. It has
a red background color and is rendered in the RedAlert component. If there is
an error message, and a modal is open, the error message will be shown at the
top of the modal. If no modal is open, the error message will be shown on the
bottom of the screen. In other words, RedAlert is rendered in both Alerts and
the Modal component.

createAlerts() creates `toast` and `redAlert`. It also returns a combined
`alert` object:

- `alert` can be used to show either `toast` or `redAlert`. `alert` defers to
  `toast` or `redAlert` based on the type of alert (success, info, or
  error/"danger").
- `alert` also provides access to data about the latest alert to be shown.
- `alert` is mostly there for backwards compatibility with the previous setup in
  which there was only one alert, not two. In contrast to before, in the current
  setup, there is no concept of an alert object having a particular "type".
  Toast and error messages are already separated by object (`toast` vs.
  `redAlert`). That means that each alert object doesn't additionally need to
  internally track its type. Instead, `toast` and `redAlert` think in terms of
  display options like `autoHide`. The `alert` object exists to translate
  between the previous setup (one alert based on alert type) and the current
  setup (two alerts that use display options).
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
    // latest one? Different cases require different things. To hide an alert,
    // do so specifically: toast.hide() and/or redAlert.hide().
  };
  for (const prop of ['state', 'messageId', 'message', 'at', 'cta']) {
    Object.defineProperty(alert, prop, {
      get() { return this.last[prop]; }
    });
  }

  return { toast, redAlert, alert };
};
