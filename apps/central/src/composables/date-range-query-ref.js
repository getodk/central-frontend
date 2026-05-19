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

import { DateTime } from 'luxon';
import useQueryRef from './query-ref';

export default () => useQueryRef({
  fromQuery: (query) => {
    if (typeof query.start === 'string' && typeof query.end === 'string') {
      const start = DateTime.fromISO(query.start);
      const end = DateTime.fromISO(query.end);
      if (start.isValid && end.isValid && start <= end)
        return [start.startOf('day'), end.startOf('day')];
    }
    return [];
  },
  toQuery: (value) => (value.length !== 0
    ? { start: value[0].toISODate(), end: value[1].toISODate() }
    : { start: null, end: null })
});
