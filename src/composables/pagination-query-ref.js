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

import useQueryRef from './query-ref';

export default (pageSizeOptions = [250, 500, 1000]) => {
  const pageNumber = useQueryRef({
    fromQuery: (query) => {
      const num = Number.parseInt(query['page-number'], 10);
      if (!num || num < 0) return 0;
      return num - 1;
    },
    toQuery: (value) => ({ 'page-number': value === 0 ? null : value + 1 })
  });

  const pageSize = useQueryRef({
    fromQuery: (query) => {
      const size = Number.parseInt(query['page-size'], 10);

      if (!size || size < pageSizeOptions[0]) return pageSizeOptions[0];
      if (size >= pageSizeOptions[2]) return pageSizeOptions[2];
      if (size >= pageSizeOptions[1]) return pageSizeOptions[1];
      return pageSizeOptions[0];
    },
    toQuery: (value) => ({ 'page-size': value })
  });

  return {
    pageNumber,
    pageSize
  };
};
