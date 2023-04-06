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
  <page-section v-if="dataset.dataExists && dataset.properties.length !== 0"
    id="entity-data">
    <template #heading><span>{{ $t('title') }}</span></template>
    <template #body>
      <dl v-if="entity.dataExists">
        <div v-for="{ name } of dataset.properties" :key="name">
          <dt><span v-tooltip.text>{{ name }}</span></dt>
          <dd><span v-tooltip.text>{{ propertyValue(name) }}</span></dd>
        </div>
      </dl>
    </template>
  </page-section>
</template>

<script>
export default {
  name: 'EntityData'
};
</script>
<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import PageSection from '../page/section.vue';

import { useRequestData } from '../../request-data';

// The component does not assume that this data will exist when the component is
// created.
const { dataset, entity } = useRequestData();

const data = computed(() => entity.currentVersion.data);
const { t } = useI18n();
const propertyValue = (name) => {
  const value = data.value[name];
  return value == null || value === '' ? t('empty') : value;
};
</script>

<style lang="scss">
@import '../../assets/scss/mixins';

#entity-data {
  // TODO. Add max-height to .page-section-body?

  dt, dd { @include text-overflow-ellipsis; }
}
</style>

<i18n lang="json5">
{
  "en": {
    // This is a title shown above a section of the page.
    "title": "Entity Data",
    // This is shown when the value of an Entity property is empty.
    "empty": "(empty)"
  }
}
</i18n>
