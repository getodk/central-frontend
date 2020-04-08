<!--
Copyright 2020 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/opendatakit/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <submission-list :base-url="baseUrl" :form-version="form" shows-submitter/>
</template>

<script>
import SubmissionList from '../submission/list.vue';
import reconcileData from '../../store/modules/request/reconcile';
import validateData from '../../mixins/validate-data';
import { apiPaths } from '../../util/request';
import { requestData } from '../../store/modules/request';

export default {
  name: 'FormSubmissions',
  components: { SubmissionList },
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
    ...requestData(['form']),
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
