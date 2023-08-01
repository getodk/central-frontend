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
  <page-section id="entity-activity">
    <template #heading>
      <span>{{ $t('common.activity') }}</span>
    </template>
    <template #body>
      <loading :state="initiallyLoading"/>
      <template v-if="dataExists">
        <entity-feed-entry v-for="(data, i) of feed" :key="feed.length - i"
          v-bind="data"/>
      </template>
    </template>
  </page-section>
</template>

<script setup>
import { computed } from 'vue';

import EntityFeedEntry from './feed-entry.vue';
import Loading from '../loading.vue';
import PageSection from '../page/section.vue';

import { useRequestData } from '../../request-data';

defineOptions({
  name: 'EntityActivity'
});

// The component does not assume that this data will exist when the component is
// created.
const { audits, diffs, resourceStates } = useRequestData();
const { initiallyLoading, dataExists } = resourceStates([audits, diffs]);

const feed = computed(() => {
  const result = [];
  let diffIndex = diffs.length - 1;
  for (const audit of audits) {
    if (audit.action === 'entity.update.version') {
      result.push({ entry: audit, diff: diffs[diffIndex] });
      diffIndex -= 1;
    } else if (audit.action === 'entity.create') {
      result.push({ entry: audit });
      const { details } = audit;
      if (details.sourceEvent?.action === 'submission.update')
        result.push({ entry: details.sourceEvent });
      if (details.submissionCreate != null)
        result.push({ entry: details.submissionCreate, submission: details.submission });
    } else {
      result.push({ entry: audit });
    }
  }
  return result;
});
</script>

<style lang="scss">
#entity-activity {
  margin-bottom: 35px;
}
</style>
