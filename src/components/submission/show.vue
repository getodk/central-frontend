<!--
Copyright 2021 ODK Central Developers
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
    <page-back v-show="submission != null" :to="formPath('submissions')">
      <template #title>{{ $t('back.title') }}</template>
      <template #back>{{ $t('back.back') }}</template>
    </page-back>
    <page-head v-show="submission != null">
      <template #title>{{ instanceNameOrId }}</template>
    </page-head>
    <page-body>
      <loading :state="initiallyLoading"/>
      <div v-show="dataExists">
        <div class="row">
          <div class="col-xs-7">
            <submission-basic-details v-if="submission != null"/>
          </div>
        </div>
      </div>
    </page-body>
  </div>
</template>

<script>
import Loading from '../loading.vue';
import PageBack from '../page/back.vue';
import PageBody from '../page/body.vue';
import PageHead from '../page/head.vue';
import SubmissionBasicDetails from './basic-details.vue';

import routes from '../../mixins/routes';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
import { requestData } from '../../store/modules/request';

export default {
  name: 'SubmissionShow',
  components: {
    Loading,
    PageBack,
    PageBody,
    PageHead,
    SubmissionBasicDetails
  },
  mixins: [routes()],
  props: {
    projectId: {
      type: String,
      required: true
    },
    xmlFormId: {
      type: String,
      required: true
    },
    instanceId: {
      type: String,
      required: true
    }
  },
  computed: {
    ...requestData(['submission']),
    initiallyLoading() {
      return this.$store.getters.initiallyLoading(['project', 'submission']);
    },
    dataExists() {
      return this.$store.getters.dataExists(['project', 'submission']);
    },
    instanceNameOrId() {
      if (this.submission == null) return null;
      const { meta } = this.submission;
      return meta != null && typeof meta.instanceName === 'string'
        ? meta.instanceName
        : this.submission.__id;
    }
  },
  created() {
    this.fetchData();
  },
  methods: {
    fetchData() {
      // We do not reconcile project.lastSubmission and
      // submission.__system.submisionDate.
      this.$store.dispatch('get', [
        {
          key: 'project',
          url: apiPaths.project(this.projectId),
          extended: true,
          resend: false
        },
        {
          key: 'submission',
          url: apiPaths.odataSubmission(
            this.projectId,
            this.xmlFormId,
            this.instanceId
          )
        }
      ]).catch(noop);
    }
  }
};
</script>

<i18n lang="json5">
{
  "en": {
    // This is shown at the top of the page.
    "back": {
      "title": "Submission Detail",
      "back": "Back to Submissions Table"
    }
  }
}
</i18n>