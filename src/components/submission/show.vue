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
    <page-back v-show="submission.dataExists" :to="formPath('submissions')">
      <template #title>{{ $t('back.title') }}</template>
      <template #back>{{ $t('back.back') }}</template>
    </page-back>
    <page-head v-show="submission.dataExists">
      <template #title>{{ submission.dataExists ? submission.instanceNameOrId : '' }}</template>
    </page-head>
    <page-body>
      <loading :state="initiallyLoading"/>
      <div v-show="dataExists" class="row">
        <div class="col-xs-4">
          <submission-basic-details/>
        </div>
        <div class="col-xs-8">
          <submission-activity :project-id="projectId" :xml-form-id="xmlFormId"
            :instance-id="instanceId"
            @update-review-state="showModal('updateReviewState')"
            @comment="fetchActivityData"/>
        </div>
      </div>
    </page-body>
    <submission-update-review-state :state="updateReviewState.state"
      :project-id="projectId" :xml-form-id="xmlFormId" :submission="submission"
      @hide="hideModal('updateReviewState')" @success="afterUpdateReviewState"/>
  </div>
</template>

<script>
import { useI18n } from 'vue-i18n';

import Loading from '../loading.vue';
import PageBack from '../page/back.vue';
import PageBody from '../page/body.vue';
import PageHead from '../page/head.vue';
import SubmissionActivity from './activity.vue';
import SubmissionBasicDetails from './basic-details.vue';
import SubmissionUpdateReviewState from './update-review-state.vue';

import modal from '../../mixins/modal';
import routes from '../../mixins/routes';
import useFields from '../../request-data/fields';
import useSubmission from '../../request-data/submission';
import { apiPaths } from '../../util/request';
import { setDocumentTitle } from '../../util/reactivity';
import { useRequestData } from '../../request-data';

export default {
  name: 'SubmissionShow',
  components: {
    Loading,
    PageBack,
    PageBody,
    PageHead,
    SubmissionActivity,
    SubmissionBasicDetails,
    SubmissionUpdateReviewState
  },
  mixins: [modal(), routes()],
  inject: ['alert'],
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
  setup() {
    const { project, resourceStates } = useRequestData();
    const { submission, submissionVersion, audits, comments, diffs } = useSubmission();
    const fields = useFields();

    const { t } = useI18n();
    setDocumentTitle(() => (submission.dataExists
      ? [`${t('title.details')}: ${submission.instanceNameOrId}`]
      : [t('title.details')]));

    return {
      project, submission, submissionVersion, audits, comments, diffs, fields,
      ...resourceStates([project, submission])
    };
  },
  data() {
    return {
      updateReviewState: {
        state: false
      }
    };
  },
  created() {
    this.fetchData();
  },
  methods: {
    fetchActivityData() {
      Promise.allSettled([
        this.audits.request({
          url: apiPaths.submissionAudits(
            this.projectId,
            this.xmlFormId,
            this.instanceId
          ),
          extended: true
        }),
        this.comments.request({
          url: apiPaths.submissionComments(
            this.projectId,
            this.xmlFormId,
            this.instanceId
          ),
          extended: true
        }),
        this.diffs.request({
          url: apiPaths.submissionDiffs(
            this.projectId,
            this.xmlFormId,
            this.instanceId
          )
        })
      ]);
    },
    fetchData() {
      Promise.allSettled([
        // We do not reconcile this.project.lastSubmission and
        // this.submission.__system.submissionDate.
        this.project.request({
          url: apiPaths.project(this.projectId),
          extended: true,
          resend: false
        }),
        this.submission.request({
          url: apiPaths.odataSubmission(
            this.projectId,
            this.xmlFormId,
            this.instanceId
          )
        }),
        this.submissionVersion.request({
          url: apiPaths.submissionVersion(
            this.projectId,
            this.xmlFormId,
            this.instanceId,
            this.instanceId
          )
        }),
        this.fields.request({
          url: apiPaths.fields(this.projectId, this.xmlFormId)
        })
      ]);
      this.fetchActivityData();
    },
    afterUpdateReviewState(submission, reviewState) {
      this.fetchActivityData();
      this.hideModal('updateReviewState');
      this.alert.success(this.$t('alert.updateReviewState'));
      this.submission.__system.reviewState = reviewState;
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

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "back": {
      "title": "Detail odeslání",
      "back": "Zpět k tabulce odeslání"
    }
  },
  "de": {
    "back": {
      "title": "Übermittlungsdetail",
      "back": "Zurück zur Übermittlungstabelle"
    }
  },
  "es": {
    "back": {
      "title": "Detalle de envío",
      "back": "Volver a la tabla de envíos"
    }
  },
  "fr": {
    "back": {
      "title": "Détails de la soumission",
      "back": "Retour au tableau de soumissions"
    }
  },
  "id": {
    "back": {
      "title": "Detail kiriman",
      "back": "Kembali ke tabel kiriman"
    }
  },
  "it": {
    "back": {
      "title": "Dettagli invio",
      "back": "Indietro alla tabella degli invii"
    }
  },
  "ja": {
    "back": {
      "title": "提出フォームの詳細",
      "back": "提出フォームの一覧に戻る"
    }
  },
  "sw": {
    "back": {
      "title": "Maelezo ya Uwasilishaji",
      "back": "Rudi kwenye Jedwali la Mawasilisho"
    }
  }
}
</i18n>
