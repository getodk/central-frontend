<!--
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div id="project-overview">
    <project-overview-description v-if="project.dataExists"
      :description="project.description" :can-update="canUpdate"/>
    <form-list/>
    <form-trash-list v-if="rendersTrashList" @restore="$emit('fetch-forms', true)"/>
  </div>
</template>

<script setup>
import { computed } from 'vue';

import FormList from '../form/list.vue';
import FormTrashList from '../form/trash-list.vue';
import ProjectOverviewDescription from './overview/description.vue';

import { useRequestData } from '../../request-data';

defineOptions({
  name: 'ProjectOverview'
});
defineProps({
  projectId: {
    type: String,
    required: true
  }
});
const emit = defineEmits(['fetch-forms']);

const { project } = useRequestData();
emit('fetch-forms', false);

const canUpdate = computed(() =>
  project.dataExists && project.permits('project.update'));
const rendersTrashList = computed(() =>
  project.dataExists && project.permits('form.restore'));
</script>
