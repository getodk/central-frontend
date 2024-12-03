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
  <hover-card icon="file">
    <template #title>{{ submission.instanceNameOrId }}</template>
    <template #subtitle>{{ $t('resource.submission') }}</template>
    <template #body>
      <dl class="dl-horizontal dl-horizontal-fixed">
        <dt>{{ $t('resource.form') }}</dt>
        <dd>{{ form.nameOrId }}</dd>

        <dt>{{ $t('header.submitterName') }}</dt>
        <dd>{{ submission.__system.submitterName }}</dd>

        <dt>{{ $t('header.submissionDate') }}</dt>
        <dd><date-time :iso="submission.__system.submissionDate"/></dd>

        <dt>{{ $t('common.lastUpdate') }}</dt>
        <dd><date-time :iso="updatedOrCreatedAt"/></dd>
      </dl>
    </template>
  </hover-card>
</template>

<script setup>
import { computed } from 'vue';

import DateTime from '../date-time.vue';
import HoverCard from '../hover-card.vue';

import { useRequestData } from '../../request-data';

defineOptions({
  name: 'HoverCardSubmission'
});

const { form, submission } = useRequestData();

const updatedOrCreatedAt = computed(() => {
  const { __system } = submission;
  return __system.updatedAt ?? __system.submissionDate;
});
</script>
