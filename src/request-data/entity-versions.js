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
import { useRequestData } from './index';

export default () => {
  const { createResource } = useRequestData();
  return createResource('entityVersions', () => ({
    transformResponse: ({ data }) => {
      for (const version of data) {
        version.baseDiff = new Set(version.baseDiff);
        version.serverDiff = new Set(version.serverDiff);
        const { conflictingProperties } = version;
        version.conflictingProperties = conflictingProperties != null
          ? new Set(conflictingProperties)
          : new Set();
      }
      return data;
    }
  }));
};
