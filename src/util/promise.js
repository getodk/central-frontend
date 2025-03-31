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

// copied from central-backend
// eslint-disable-next-line import/prefer-default-export
export const runSequentially = async (functions) => {
  const results = [];

  for (const fn of functions) {
    // eslint-disable-next-line no-await-in-loop
    results.push(await fn());
  }

  return results;
};
