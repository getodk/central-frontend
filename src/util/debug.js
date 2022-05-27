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
import { nextTick } from 'vue';

// eslint-disable-next-line no-console
const logTick = () => { console.log('tick'); };
// eslint-disable-next-line import/prefer-default-export
export const ticking = (count, callback = logTick) => {
  let i = 0;
  const ticker = () => {
    callback(i);
    i += 1;
    if (i < count) nextTick(ticker);
  };
  nextTick(ticker);
};
