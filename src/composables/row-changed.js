/*
Copyright 2023 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import { watchSync } from '../util/reactivity';

export const useRowChanged = (tr) => {
  watchSync(tr, () => {
    if (tr.value != null)
      // eslint-disable-next-line no-param-reassign
      tr.value.dataset.useRowChanged = 'false';
  });
};

export const rowsChanged = (trs) => {
  for (const tr of trs) tr.dataset.useRowChanged = 'true';
  setTimeout(() => {
    for (const tr of trs) tr.dataset.useRowChanged = 'false';
  });
};

export const rowChanged = (tr) => { rowsChanged([tr]); };
