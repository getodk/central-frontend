<!--
Copyright 2023 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <page-section>
    <template #heading>
      <span>{{ $t('common.activity') }}</span>
    </template>
    <template #body>
      <loading :state="initiallyLoading"/>
      <template v-if="dataExists">
        TODO
      </template>
    </template>
  </page-section>
</template>

<script>
export default {
  name: 'EntityActivity'
};
</script>
<script setup>
import Loading from '../loading.vue';
import PageSection from '../page/section.vue';

import { useRequestData } from '../../request-data';

// The component does not assume that this data will exist when the component is
// created.
const { audits, diffs, resourceStates } = useRequestData();
const { initiallyLoading, dataExists } = resourceStates([audits, diffs]);
</script>
