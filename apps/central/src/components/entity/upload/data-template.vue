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
  <a :href="href" @click="setFilename">
    <slot></slot>
  </a>
</template>

<script setup>
import { DateTime } from 'luxon';
import { computed } from 'vue';

import { useRequestData } from '../../../request-data';

defineOptions({
  name: 'EntityUploadDataTemplate'
});

// The component does not assume that this data will exist when the component is
// created.
const { dataset } = useRequestData();

const href = computed(() => {
  if (!dataset.dataExists) return '#';
  const headers = dataset.properties.map(({ name }) => name);
  headers.unshift('label');
  const csv = headers.join(',');
  // \uFEFF is byte-order-mark - fixes getodk/central#721
  return `data:text/csv;charset=UTF-8,\uFEFF${encodeURIComponent(csv)}`;
});
const setFilename = (event) => {
  const now = DateTime.local().toFormat('yyyyMMddHHmmss');
  event.target.setAttribute('download', `${dataset.name} ${now}.csv`);
};
</script>
