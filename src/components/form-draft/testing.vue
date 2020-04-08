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
  <div>
    <div id="form-draft-testing-info" class="row">
      <div class="col-xs-8">
        <page-section condensed>
          <template #heading><span>Draft Testing</span></template>
          <template #body>
            <p>
              You can use the configuration code to the right to set up a mobile
              device to download this Draft. If you fill a blank of the Draft
              Form and upload it, the Submission will go only into this test
              table below. You can preview and download the test Submissions
              below.
            </p>
            <p>
              When you publish this Draft Form, these test Submissions will be
              permanently removed. Please see
              <!-- TODO. Specify the `to` attribute. -->
              <doc-link>this article</doc-link>
              for more information.
            </p>
          </template>
        </page-section>
      </div>
      <div class="col-xs-4">
        <float-row>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <span v-if="formDraft != null" v-html="qrCodeHtml"></span>
        </float-row>
      </div>
    </div>
    <submission-list :base-url="baseUrl" :form-version="formDraft"/>
  </div>
</template>

<script>
import DocLink from '../doc-link.vue';
import FloatRow from '../float-row.vue';
import Option from '../../util/option';
import PageSection from '../page/section.vue';
import SubmissionList from '../submission/list.vue';
import collectQr from '../../util/collect-qr';
import reconcileData from '../../store/modules/request/reconcile';
import validateData from '../../mixins/validate-data';
import { apiPaths } from '../../util/request';
import { requestData } from '../../store/modules/request';

export default {
  name: 'FormDraftTesting',
  components: { DocLink, FloatRow, PageSection, SubmissionList },
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
    ...requestData([{ key: 'formDraft', getOption: true }]),
    qrCodeHtml() {
      const url = apiPaths.serverUrlForFormDraft(
        this.formDraft.draftToken,
        this.projectId,
        this.xmlFormId
      );
      return collectQr(url, { errorCorrectionLevel: 'Q', cellSize: 3 });
    },
    baseUrl() {
      return apiPaths.formDraft(this.projectId, this.xmlFormId);
    }
  },
  created() {
    const deactivate = reconcileData.add(
      'formDraft', 'submissionsChunk',
      (formDraft, submissionsChunk) => {
        if (formDraft.isDefined() &&
          formDraft.get().submissions !== submissionsChunk['@odata.count']) {
          this.$store.commit('setData', {
            key: 'formDraft',
            value: Option.of(formDraft.get().with({
              submissions: submissionsChunk['@odata.count']
            }))
          });
        }
      }
    );
    this.$once('hook:beforeDestroy', deactivate);
  }
};
</script>

<style lang="scss">
#form-draft-testing-info {
  .page-section, .float-row {
    margin-bottom: 25px;
  }
}
</style>
