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
    <div v-if="rendersTopRow" class="row">
      <div class="col-xs-6">
        <project-overview-about/>
      </div>
      <div class="col-xs-6">
        <project-overview-right-now @scroll-to-forms="scrollToForms"/>
      </div>
    </div>
    <form-list :condensed="!rendersTopRow"/>
  </div>
</template>

<script>
import FormList from '../form/list.vue';
import ProjectOverviewAbout from './overview/about.vue';
import ProjectOverviewRightNow from './overview/right-now.vue';
import routes from '../../mixins/routes';
import validateData from '../../mixins/validate-data';
import { requestData } from '../../store/modules/request';

export default {
  name: 'ProjectOverview',
  components: { FormList, ProjectOverviewAbout, ProjectOverviewRightNow },
  mixins: [routes(), validateData()],
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
    rendersTopRow() {
      return this.project != null && this.project.permits('project.update');
    }
  },
  watch: {
    projectId() {
      this.$emit('fetch-forms');
    }
  },
  created() {
    this.$emit('fetch-forms', false);
  },
  methods: {
    scrollToForms() {
      const scrollTop = Math.round($('#form-list').offset().top);
      $('html, body').animate({ scrollTop });
    }
  }
};
</script>

<style lang="scss">
#project-overview > .row {
  margin-top: 10px;

  + #form-list { margin-top: 10px; }
}
</style>
