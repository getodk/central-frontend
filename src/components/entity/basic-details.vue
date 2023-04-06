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
  <page-section id="entity-basic-details">
    <template #heading><span>{{ $t('common.basicInfo') }}</span></template>
    <template #body>
      <dl v-if="entity.dataExists">
        <div>
          <dt>{{ $t('entity.entityId') }}</dt>
          <dd>{{ entity.uuid }}</dd>
        </div>
        <div>
          <dt>{{ $t('creatingSubmission') }}</dt>
          <dd>TODO</dd>
        </div>
        <div>
          <dt>{{ $t('header.createdAt') }}</dt>
          <dd><date-time :iso="entity.createdAt"/></dd>
        </div>
        <div>
          <dt>{{ $t('header.createdBy') }}</dt>
          <dd><actor-link :actor="entity.creator"/></dd>
        </div>
      </dl>
    </template>
  </page-section>
</template>

<script>
export default {
  name: 'EntityBasicDetails'
};
</script>
<script setup>
import ActorLink from '../actor-link.vue';
import DateTime from '../date-time.vue';
import PageSection from '../page/section.vue';

import { useRequestData } from '../../request-data';

// The component does not assume that this data will exist when the component is
// created.
const { entity } = useRequestData();
</script>

<style lang="scss">
@import '../../assets/scss/mixins';

#entity-basic-details {
  margin-bottom: 35px;

  dd { @include text-overflow-ellipsis; }
}
</style>

<i18n lang="json5">
{
  "en": {
    // This is shown above the Submission that created the Entity.
    "creatingSubmission": "Creating Submission"
  }
}
</i18n>
