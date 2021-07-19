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
      <template #title>{{ submission != null ? instanceNameOrId : '' }}</template>
    </page-head>
    <page-body>
      <loading :state="initiallyLoading"/>
      <div v-show="dataExists" class="row">
        <div class="col-xs-4">
          <submission-basic-details v-if="submission != null"/>
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
import Loading from '../loading.vue';
import PageBack from '../page/back.vue';
import PageBody from '../page/body.vue';
import PageHead from '../page/head.vue';
import SubmissionActivity from './activity.vue';
import SubmissionBasicDetails from './basic-details.vue';
import SubmissionUpdateReviewState from './update-review-state.vue';

import modal from '../../mixins/modal';
import routes from '../../mixins/routes';
import { apiPaths } from '../../util/request';
import { instanceNameOrId } from '../../util/odata';
import { noop } from '../../util/util';
import { requestData } from '../../store/modules/request';

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
  data() {
    return {
      updateReviewState: {
        state: false
      }
    };
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
      return instanceNameOrId(this.submission);
    }
  },
  created() {
    this.fetchData();
    document.body.classList.add('scroll');
  },
  beforeDestroy() {
    document.body.classList.remove('scroll');
  },
  methods: {
    fetchActivityData() {
      this.$store.dispatch('get', [
        {
          key: 'audits',
          url: apiPaths.submissionAudits(
            this.projectId,
            this.xmlFormId,
            this.instanceId
          ),
          extended: true
        },
        {
          key: 'comments',
          url: apiPaths.submissionComments(
            this.projectId,
            this.xmlFormId,
            this.instanceId
          ),
          extended: true
        }
      ]).catch(noop);
    },
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
      this.fetchActivityData();
    },
    afterUpdateReviewState(submission, reviewState) {
      this.fetchActivityData();
      this.hideModal('updateReviewState');
      this.$alert().success(this.$t('alert.updateReviewState'));
      this.$store.commit('setData', {
        key: 'submission',
        value: {
          ...submission,
          __system: { ...submission.__system, reviewState }
        }
      });
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
  }
}
</i18n>
