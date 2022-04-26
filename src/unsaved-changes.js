/*
Copyright 2022 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/

class UnsavedChanges {
  constructor() { this._count = 0; }
  get count() { return this._count; }
  plus(n) { this._count += n; }
  minus(n) { this._count -= n; }
  zero() { this._count = 0; }
}

export default (i18n) => {
  const unsavedChanges = new UnsavedChanges();
  unsavedChanges.confirm = function confirm() {
    // eslint-disable-next-line no-alert
    return this.count === 0 || window.confirm(i18n.t('router.unsavedChanges'));
  };
  return unsavedChanges;
};
