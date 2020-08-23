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
  <page-section condensed>
    <template #heading>
      <span>{{ $t('resource.submissions') }}</span>
      <enketo-fill v-if="dataExists && project.permits('submission.create')"
        :form-version="form">
        <span class="icon-plus-circle"></span>{{ $t('action.createSubmission') }}
      </enketo-fill>
    </template>
    <template #body>
      <submission-list :base-url="baseUrl" :form-version="form"
        shows-submitter/>
    </template>
  </page-section>
</template>

<script>
import EnketoFill from '../enketo/fill.vue';
import PageSection from '../page/section.vue';
import SubmissionList from '../submission/list.vue';
import reconcileData from '../../store/modules/request/reconcile';
import validateData from '../../mixins/validate-data';
import { apiPaths } from '../../util/request';
import { requestData } from '../../store/modules/request';

const requestKeys = ['project', 'form'];

export default {
  name: 'FormSubmissions',
  components: { EnketoFill, PageSection, SubmissionList },
  mixins: [validateData()],
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
    // The component does not assume that this data will exist when the
    // component is created.
    ...requestData(requestKeys),
    dataExists() {
      return this.$store.getters.dataExists(requestKeys);
    },
    baseUrl() {
      return apiPaths.form(this.projectId, this.xmlFormId);
    }
  },
  created() {
    // We do not reconcile submissionsChunk with either form.lastSubmission or
    // project.lastSubmission.
    const deactivate = reconcileData.add(
      'form', 'submissionsChunk',
      (form, submissionsChunk, commit) => {
        if (form.submissions !== submissionsChunk['@odata.count']) {
          commit('setData', {
            key: 'form',
            value: this.form.with({
              submissions: submissionsChunk['@odata.count']
            })
          });
        }
      }
    );
    this.$once('hook:beforeDestroy', deactivate);
  }
};
</script>
