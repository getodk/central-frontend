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

<!-- Specifying :key so that if `to` changes, the element will be replaced. If a
hover card is shown next to the element, it will be hidden. -->
<template>
  <router-link ref="link" :key="to" :to="to">
    {{ submission.currentVersion.instanceName ?? submission.instanceId }}
  </router-link>
</template>

<script setup>
import { computed, ref } from 'vue';

import useHoverCard from '../../composables/hover-card';
import useRoutes from '../../composables/routes';

defineOptions({
  name: 'SubmissionLink'
});
const props = defineProps({
  projectId: {
    type: [Number, String],
    required: true
  },
  xmlFormId: {
    type: String,
    required: true
  },
  // A submission in the format of a REST API response (not OData). It is not
  // expected to be a transformed submission resource. For example,
  // props.submission.instanceNameOrId is not expected to be defined.
  submission: {
    type: Object,
    required: true
  }
});

const { submissionPath } = useRoutes();
const to = computed(() =>
  submissionPath(props.projectId, props.xmlFormId, props.submission.instanceId));

const link = ref(null);
useHoverCard(computed(() => link.value?.$el), 'submission', () => ({
  projectId: props.projectId,
  xmlFormId: props.xmlFormId,
  instanceId: props.submission.instanceId
}));
</script>
