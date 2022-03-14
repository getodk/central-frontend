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

<script>
import FormList from '../form/list.vue';
import FormTrashList from '../form/trash-list.vue';
import { requestData } from '../../store/modules/request';

export default {
  name: 'ProjectOverview',
  components: { FormList, FormTrashList },
  props: {
    projectId: {
      type: String,
      required: true
    }
  },
  computed: {
    // The component does not assume that this data will exist when the
    // component is created.
    ...requestData(['project']),
    rendersTrashList() {
      return this.project != null && this.project.permits('form.restore');
    }
  },
  created() {
    this.$emit('fetch-forms', false);
  }
};
</script>
