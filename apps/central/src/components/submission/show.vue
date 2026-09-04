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
  <div id="submission-show">
    <breadcrumbs v-if="dataExists" :links="breadcrumbLinks"/>
    <page-head v-show="dataExists">
      <template #title>{{ submission.dataExists ? submission.instanceNameOrId : '' }}</template>
    </page-head>
    <page-body>
      <loading :state="initiallyLoading"/>
      <div v-show="dataExists" class="row">
        <div class="col-xs-4">
          <submission-basic-details/>
          <page-section id="submission-data-section">
            <template #heading>
              <span>{{ $t('common.data') }}</span>
              <submission-def-dropdown :project-id="projectId"
                :xml-form-id="xmlFormId" :instance-id="instanceId"
                @view-xml="viewXml"/>
            </template>
            <template #body>
              <submission-data :project-id="projectId" :xml-form-id="xmlFormId"
                :instance-id="instanceId"/>
            </template>
          </page-section>
        </div>
        <div class="col-xs-8">
          <submission-activity :project-id="projectId" :xml-form-id="xmlFormId"
            :instance-id="instanceId" @review="reviewModal.show()"
            @comment="fetchActivityData" @delete="deleteModal.show()"/>
        </div>
      </div>
    </page-body>
    <submission-update-review-state v-bind="reviewModal" :project-id="projectId"
      :xml-form-id="xmlFormId" :submission="submission"
      @hide="reviewModal.hide()" @success="afterReview"/>
    <submission-delete v-bind="deleteModal" :submission="submission"
      :awaiting-response="awaitingResponse" @hide="deleteModal.hide()"
      @delete="requestDelete"/>
    <xml-viewer v-bind="viewXmlModal" :xml="submissionXml.data"
      :loading="submissionXml.awaitingResponse" @hide="viewXmlModal.hide()"/>
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue';
import { useI18n } from 'vue-i18n';

import Breadcrumbs from '../breadcrumbs.vue';
import Loading from '../loading.vue';
import PageBody from '../page/body.vue';
import PageHead from '../page/head.vue';
import PageSection from '../page/section.vue';
import SubmissionActivity from './activity.vue';
import SubmissionBasicDetails from './basic-details.vue';
import SubmissionData from './data.vue';
import SubmissionDefDropdown from './def-dropdown.vue';
import SubmissionUpdateReviewState from './update-review-state.vue';
import SubmissionDelete from './delete.vue';

import useFields from '../../request-data/fields';
import useRoutes from '../../composables/routes';
import useRequest from '../../composables/request';
import useSubmission from '../../request-data/submission';
import { apiPaths } from '../../util/request';
import { loadAsync } from '../../util/load-async';
import { modalData, setDocumentTitle } from '../../util/reactivity';
import { useRequestData } from '../../request-data';
import { noop } from '../../util/util';

export default {
  name: 'SubmissionShow',
  components: {
    Breadcrumbs,
    Loading,
    PageBody,
    PageHead,
    PageSection,
    SubmissionActivity,
    SubmissionBasicDetails,
    SubmissionData,
    SubmissionDefDropdown,
    SubmissionDelete,
    SubmissionUpdateReviewState,
    XmlViewer: defineAsyncComponent(loadAsync('XmlViewer')),
  },
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
    const { project, form, createResource, resourceStates } = useRequestData();
    const { request, awaitingResponse } = useRequest();

    const { submission, submissionVersion, audits, comments, diffs } = useSubmission();
    const fields = useFields();
    const submissionXml = createResource('submissionXml');

    const { t } = useI18n();
    setDocumentTitle(() => (submission.dataExists
      ? [`${t('title.details')}: ${submission.instanceNameOrId}`]
      : [t('title.details')]));

    const { formPath, projectPath } = useRoutes();
    return {
      project, form, submission, submissionVersion, audits, comments, diffs, fields,
      submissionXml, request, awaitingResponse, ...resourceStates([project, form, submission]),
      reviewModal: modalData(), deleteModal: modalData(), viewXmlModal: modalData(),
      formPath, projectPath
    };
  },
  computed: {
    breadcrumbLinks() {
      return [
        { text: this.project.dataExists ? this.project.nameWithArchived : this.$t('resource.project'), path: this.projectPath(), icon: 'icon-archive' },
        { text: this.form.dataExists ? this.form.nameOrId : this.$t('resource.form'), path: this.formPath(), icon: 'icon-file' },
        { text: this.submission.instanceNameOrId }
      ];
    }
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
        this.form.request({
          url: apiPaths.form(this.projectId, this.xmlFormId),
          extended: false
        }),
        this.submission.request({
          url: apiPaths.odataSubmission(
            this.projectId,
            this.xmlFormId,
            this.instanceId,
            { $wkt: true }
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
    afterReview(reviewState) {
      this.fetchActivityData();
      this.reviewModal.hide();
      this.alert.success(this.$t('alert.updateReviewState'));
      this.submission.__system.reviewState = reviewState;
    },
    viewXml() {
      this.viewXmlModal.show();
      const url = apiPaths.submissionXml(this.projectId, this.xmlFormId, this.instanceId);
      this.submissionXml.request({ url }).catch(noop);
    },
    requestDelete([{ __id: instanceId }]) {
      this.request({
        method: 'DELETE',
        url: apiPaths.submission(this.projectId, this.xmlFormId, instanceId),
        fulfillProblem: ({ code }) => code === 404.1
      })
        .then(() => {
          const message = this.$t('alert.submissionDeleted');
          this.$router.push(this.formPath('submissions'))
            .then(() => { this.alert.success(message); });
        })
        .catch(noop);
    }
  }
};
</script>

<style lang="scss">
  #submission-show {
    .page-section-heading {
      font-size: 24px;
    }

    .submission-data {
      max-height: 510px;
      overflow-y: auto;
    }
  }

  #submission-data-section .page-section-heading {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
</style>

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
  "pt": {
    "back": {
      "title": "Detalhes da resposta",
      "back": "Voltar à tabela de respostas"
    }
  },
  "sw": {
    "back": {
      "title": "Maelezo ya Uwasilishaji",
      "back": "Rudi kwenye Jedwali la Mawasilisho"
    }
  },
  "zh": {
    "back": {
      "title": "提交详情",
      "back": "返回提交表格"
    }
  },
  "zh-Hant": {
    "back": {
      "title": "提交詳情",
      "back": "返回提交表"
    }
  }
}
</i18n>
