/*
Copyright 2020 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/

const byKey = {};

export default {
  add(key1, key2, reconcile) {
    const reconcileIfExists = (data, commit) => {
      const value1 = data[key1];
      const value2 = data[key2];
      if (value1 != null && value2 != null) reconcile(value1, value2, commit);
    };
    const keys = [key1, key2];
    for (const key of keys) {
      if (byKey[key] == null) byKey[key] = new Set();
      byKey[key].add(reconcileIfExists);
    }
    return () => {
      for (const key of keys)
        byKey[key].delete(reconcileIfExists);
    };
  },

  reconcile(key, data, commit) {
    if (byKey[key] != null) {
      for (const reconcile of byKey[key])
        reconcile(data, commit);
    }
  }
};
