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
    <loading :state="initiallyLoading"/>
    <page-section v-show="keys != null" condensed>
      <template #heading>
        <span>{{ t('resource.submissions') }}</span>
        <enketo-fill v-if="rendersEnketoFill" :form-version="form">
          <span class="icon-plus-circle"></span>{{ t('action.createSubmission') }}
        </enketo-fill>
        <submission-data-access :form-version="form" @analyze="analyze.show"/>
      </template>
      <template #body>
        <submission-list :project-id="projectId" :xml-form-id="xmlFormId"/>
      </template>
    </page-section>
    <submission-analyze v-bind="analyzeModal.data" @hide="analyzeModal.hide"/>
  </div>
</template>

<script>
import { computed, inject, provide, watchSyncEffect } from 'vue';
import { useI18n } from 'vue-i18n';

import EnketoFill from '../enketo/fill.vue';
import Loading from '../loading.vue';
import PageSection from '../page/section.vue';
import SubmissionAnalyze from '../submission/analyze.vue';
import SubmissionDataAccess from '../submission/data-access.vue';
import SubmissionList from '../submission/list.vue';

import modalData from '../../util/modal';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';

export default {
  name: 'FormSubmissions',
  components: {
    EnketoFill,
    Loading,
    PageSection,
    SubmissionAnalyze,
    SubmissionDataAccess,
    SubmissionList
  },
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
  setup(props) {
    const requestData = inject('requestData');
    const { project, form, odataChunk, keys } = requestData;
    keys.request({
      url: apiPaths.submissionKeys(props.projectId, props.xmlFormId)
    }).catch(noop);
    const initiallyLoading = requestData.initiallyLoading(['keys']);

    // We do not reconcile odataChunk with either form.lastSubmission or
    // project.lastSubmission.
    watchSyncEffect(() => {
      if (form.data == null || odataChunk.data == null) return;
      const odataCount = odataChunk.data['@odata.count'];
      if (form.data.submissions !== odataCount && !odataChunk.data.filtered)
        form.update({ submissions: odataCount });
    });

    const rendersEnketoFill = computed(() => project.data != null &&
      project.data.permits('submission.create') && form.data != null);

    provide('projectId', props.projectId);
    provide('xmlFormId', props.xmlFormId);
    provide('draft', false);

    return {
      t: useI18n().t,
      form: form.ref, keys: keys.ref, initiallyLoading,
      analyze: modalData(),
      rendersEnketoFill
    };
  }
};
</script>

<style lang="scss">
#submission-data-access { float: right; }
</style>
