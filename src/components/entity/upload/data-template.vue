<!--
Copyright 2024 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <i18n-t tag="span" keypath="text.full">
    <template #downloadTemplate>
      <a class="btn" :class="error ? 'btn-danger' : 'btn-default'" :href="href"
        @click="setFilename">
        <span class="icon-download"></span>{{ $t('text.downloadTemplate') }}
      </a>
    </template>
  </i18n-t>
</template>

<script setup>
import { DateTime } from 'luxon';
import { computed } from 'vue';

import { useRequestData } from '../../../request-data';

defineOptions({
  name: 'EntityUploadDataTemplate'
});
defineProps({
  error: Boolean
});

// The component assumes that this data will exist when the component is
// created.
const { dataset } = useRequestData();

const href = computed(() => {
  const headers = dataset.properties.map(({ name }) => name);
  headers.unshift('label');
  const csv = headers.join(',');
  return `data:text/csv;charset=UTF-8,${encodeURIComponent(csv)}`;
});
const setFilename = (event) => {
  const now = DateTime.local().toFormat('yyyyMMddHHmmss');
  event.target.setAttribute('download', `${dataset.name} ${now}.csv`);
};
</script>

<i18n lang="json5">
{
  "en": {
    "text": {
      "full": "If you aren’t sure, you can {downloadTemplate}",
      "downloadTemplate": "Download a data template (.csv)"
    }
  }
}
</i18n>
