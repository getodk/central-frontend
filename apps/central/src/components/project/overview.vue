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
    <form-list/>
    <form-trash-list v-if="rendersTrashList" @restore="$emit('fetch-forms', true)"/>
  </div>
</template>

<script setup>
import { computed } from 'vue';

import FormList from '../form/list.vue';
import FormTrashList from '../form/trash-list.vue';

import { useRequestData } from '../../request-data';

defineOptions({
  // Today, this component only renders forms, so ProjectForms would be an
  // appropriate name for it. It's named ProjectOverview for historical reasons:
  // it used to be the project overview page, rendering additional things beyond
  // forms.
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

const rendersTrashList = computed(() =>
  project.dataExists && project.permits('form.restore'));
</script>
