<!--
Copyright 2020 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div>
    <loading :state="keys.initiallyLoading"/>
    <page-section v-show="keys.dataExists">
      <template #heading>
        <span>{{ $t('resource.submissions') }}</span>
        <enketo-fill v-if="rendersEnketoFill" :form-version="form">
          <span class="icon-plus-circle"></span>{{ $t('action.createSubmission') }}
        </enketo-fill>
        <o-data-access :analyze-disabled="analyzeDisabled"
          :analyze-disabled-message="analyzeDisabledMessage"
          @analyze="showModal('analyze')"/>
      </template>
      <template #body>
        <submission-list :project-id="projectId" :xml-form-id="xmlFormId"/>
      </template>
    </page-section>
    <o-data-analyze v-bind="analyze" :odata-url="odataUrl"
      @hide="hideModal('analyze')"/>
  </div>
</template>

<script>
import EnketoFill from '../enketo/fill.vue';
import Loading from '../loading.vue';
import PageSection from '../page/section.vue';
import ODataAnalyze from '../odata/analyze.vue';
import ODataAccess from '../odata/data-access.vue';
import SubmissionList from '../submission/list.vue';

import modal from '../../mixins/modal';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
import { useRequestData } from '../../request-data';

export default {
  name: 'FormSubmissions',
  components: {
    EnketoFill,
    Loading,
    PageSection,
    ODataAnalyze,
    ODataAccess,
    SubmissionList
  },
  mixins: [modal()],
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
  setup() {
    const { project, form, createResource } = useRequestData();
    const keys = createResource('keys');
    return { project, form, keys };
  },
  data() {
    return {
      analyze: {
        state: false
      }
    };
  },
  computed: {
    rendersEnketoFill() {
      return this.project.dataExists &&
        this.project.permits('submission.create') && this.form.dataExists;
    },
    analyzeDisabled() {
      // Used to disable odata access button if criteria met:
      // If an encrypted form has no submissions, then there will never be
      // decrypted submissions available to OData (as long as the form remains
      // encrypted).
      if (this.form.dataExists && this.form.keyId != null &&
        this.form.submissions === 0)
        return true;
      if (this.keys != null && this.keys.length !== 0) return true;
      return false;
    },
    analyzeDisabledMessage() {
      return this.$t('analyzeDisabled');
    },
    odataUrl() {
      if (!this.form.dataExists) return '';
      const path = apiPaths.odataSvc(this.form.projectId, this.form.xmlFormId);
      return `${window.location.origin}${path}`;
    }
  },
  created() {
    this.fetchData();
  },
  methods: {
    fetchData() {
      this.keys.request({
        url: apiPaths.submissionKeys(this.projectId, this.xmlFormId)
      }).catch(noop);
    }
  }
};
</script>

<style lang="scss">
#odata-access { float: right; }
</style>

<i18n lang="json5">
  {
    "en": {
      "analyzeDisabled": "OData access is unavailable due to Form encryption"
    }
  }
</i18n>
