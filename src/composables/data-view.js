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
import { computed, inject } from 'vue';

import useQueryRef from './query-ref';

export default () => {
  const { i18n } = inject('container');

  const dataView = useQueryRef({
    fromQuery: (query) => (!query.deleted && query.map === 'true' ? 'map' : 'table'),
    toQuery: (value) => ({ map: value === 'map' ? 'true' : null })
  });

  const options = computed(() => [
    { value: 'table', text: i18n.t('common.table') },
    { value: 'map', text: i18n.t('common.map') }
  ]);

  return { dataView, options };
};
