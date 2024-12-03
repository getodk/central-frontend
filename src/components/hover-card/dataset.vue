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
  <hover-card class="hover-card-dataset" icon="database">
    <template #title>{{ dataset.name }}</template>
    <template #subtitle>{{ $t('resource.entityList') }}</template>
    <template #body>
      <dl class="dl-horizontal dl-horizontal-fixed">
        <dt>{{ $t('resource.entities') }}</dt>
        <dd class="hover-card-dataset-entities">
          {{ $n(dataset.entities, 'default') }}
        </dd>

        <dt>{{ $t('header.lastEntity') }}</dt>
        <dd class="hover-card-dataset-last-entity">
          <date-time :iso="dataset.lastEntity"/>
        </dd>

        <dt>{{ $t('resource.properties') }}</dt>
        <dd class="hover-card-dataset-property-count">
          {{ $n(dataset.properties.length, 'default') }}
        </dd>
      </dl>
    </template>
    <template #footer>
      <div v-if="dataset.properties.length !== 0"
        class="hover-card-dataset-property-list">
        <div v-for="{ name } of dataset.properties" :key="name">{{ name }}</div>
      </div>
    </template>
  </hover-card>
</template>

<script setup>
import DateTime from '../date-time.vue';
import HoverCard from '../hover-card.vue';

import { useRequestData } from '../../request-data';

defineOptions({
  name: 'HoverCardDataset'
});

const { dataset } = useRequestData();
</script>

<style lang="scss">
@import '../../assets/scss/variables';

.hover-card-dataset-property-list {
  display: flex;
  margin-inline: -$padding-hover-card;
  overflow-x: hidden;
  padding-block: 6px;

  div {
    font-weight: bold;

    padding: 4px 6px;
    &:first-child { padding-left: $padding-hover-card; }
    &:last-child { padding-right: $padding-hover-card; }

    + div { border-left: 1px solid #bbb; }
  }
}
</style>
