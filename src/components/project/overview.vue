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
    <project-overview-description v-if="project != null"
      :description="project.description" :can-update="canUpdate"/>
    <form-list/>
    <form-trash-list v-if="rendersTrashList" @restore="$emit('fetch-forms', true)"/>
  </div>
</template>

<script>
import ProjectOverviewDescription from './overview/description.vue';
import FormList from '../form/list.vue';
import FormTrashList from '../form/trash-list.vue';
import { requestData } from '../../store/modules/request';

export default {
  name: 'ProjectOverview',
  components: { ProjectOverviewDescription, FormList, FormTrashList },
  props: {
    projectId: {
      type: String,
      required: true
    }
  },
  emits: ['fetch-forms'],
  computed: {
    // The component does not assume that this data will exist when the
    // component is created.
    ...requestData(['project']),
    canUpdate() {
      return this.project != null && this.project.permits('project.update');
    },
    rendersTrashList() {
      return this.project != null && this.project.permits('form.restore');
    }
  },
  created() {
    this.$emit('fetch-forms', false);
  }
};
</script>
