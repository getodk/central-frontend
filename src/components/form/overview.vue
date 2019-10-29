<!--
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/opendatakit/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div id="form-overview">
    <loading :state="initiallyLoading"/>
    <div v-if="dataExists" class="row">
      <div class="col-xs-6">
        <form-checklist/>
      </div>
      <div class="col-xs-6">
        <form-overview-right-now/>
      </div>
    </div>
  </div>
</template>

<script>
import FormChecklist from './checklist.vue';
import FormOverviewRightNow from './overview/right-now.vue';
import { requestData } from '../../store/modules/request';

const REQUEST_KEYS = ['project', 'form', 'attachments', 'assignmentActors'];

export default {
  name: 'FormOverview',
  components: { FormChecklist, FormOverviewRightNow },
  // Setting this in order to ignore attributes from FormShow that are intended
  // for other form-related components.
  inheritAttrs: false,
  props: {
    projectId: {
      type: String,
      required: true
    },
    xmlFormId: {
      type: String,
      required: true
    }
  },
  computed: {
    ...requestData(REQUEST_KEYS),
    initiallyLoading() {
      return this.$store.getters.initiallyLoading(REQUEST_KEYS);
    },
    dataExists() {
      return this.$store.getters.dataExists(REQUEST_KEYS);
    }
  },
  created() {
    this.fetchData();
  },
  beforeRouteUpdate() {
    this.fetchData();
  },
  methods: {
    fetchData() {
      const encodedFormId = encodeURIComponent(this.xmlFormId);
      this.$store.dispatch('get', [{
        key: 'assignmentActors',
        url: `/projects/${this.projectId}/forms/${encodedFormId}/assignments/app-user`,
        resend: false
      }]);
    }
  }
};
</script>

<style lang="scss">
#form-overview .row {
  margin-top: 10px;
}
</style>
