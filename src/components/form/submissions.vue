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
    <loading :state="$store.getters.initiallyLoading(['keys'])"/>
    <page-section v-show="keys != null">
      <template #heading>
        <span>{{ $t('resource.submissions') }}</span>
        <enketo-fill v-if="rendersEnketoFill" :form-version="form">
          <span class="icon-plus-circle"></span>{{ $t('action.createSubmission') }}
        </enketo-fill>
        <submission-data-access :form-version="form"
          @analyze="showModal('analyze')"/>
      </template>
      <template #body>
        <submission-list :project-id="projectId" :xml-form-id="xmlFormId"/>
      </template>
    </page-section>
    <submission-analyze v-bind="analyze" @hide="hideModal('analyze')"/>
  </div>
</template>

<script>
import EnketoFill from '../enketo/fill.vue';
import Loading from '../loading.vue';
import PageSection from '../page/section.vue';
import SubmissionAnalyze from '../submission/analyze.vue';
import SubmissionDataAccess from '../submission/data-access.vue';
import SubmissionList from '../submission/list.vue';

import modal from '../../mixins/modal';
import reconcileData from '../../store/modules/request/reconcile';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
import { requestData } from '../../store/modules/request';

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
  data() {
    return {
      analyze: {
        state: false
      }
    };
  },
  computed: {
    // The component does not assume that this data will exist when the
    // component is created.
    ...requestData(['project', 'form', 'keys']),
    rendersEnketoFill() {
      return this.project != null &&
        this.project.permits('submission.create') && this.form != null;
    }
  },
  created() {
    this.fetchData();
    this.reconcileSubmissionCount();
  },
  methods: {
    fetchData() {
      this.$store.dispatch('get', [{
        key: 'keys',
        url: apiPaths.submissionKeys(this.projectId, this.xmlFormId)
      }]).catch(noop);
    },
    reconcileSubmissionCount() {
      // We do not reconcile odataChunk with either form.lastSubmission or
      // project.lastSubmission.
      const deactivate = reconcileData.add(
        'form', 'odataChunk',
        (form, odataChunk, commit) => {
          if (form.submissions !== odataChunk['@odata.count'] &&
            !odataChunk.filtered) {
            commit('setData', {
              key: 'form',
              value: this.form.with({ submissions: odataChunk['@odata.count'] })
            });
          }
        }
      );
      this.$once('hook:beforeDestroy', deactivate);
    }
  }
};
</script>

<style lang="scss">
#submission-data-access { float: right; }
</style>
