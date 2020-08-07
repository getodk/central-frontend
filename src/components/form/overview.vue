<!--
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div id="form-overview">
    <div class="row">
      <div class="col-xs-6">
        <form-overview-right-now v-if="form != null"/>
        <page-section condensed>
          <template #heading>
            <span>{{ $t('checklist') }}</span>
          </template>
          <template #body>
            <form-checklist
              @show-submission-options="showModal('submissionOptions')"/>
          </template>
        </page-section>
      </div>
      <div v-if="formDraft != null" id="form-overview-draft" class="col-xs-6">
        <page-section v-if="formDraft.isDefined()" condensed>
          <template #heading>
            <span>{{ $t('common.currentDraft') }}</span>
          </template>
          <template #body>
            <form-version-summary-item :version="formDraft.get()">
              <template #body>
                <i18n tag="p" path="draft.any.versionCaption.full">
                  <template #draftVersion>
                    <strong>{{ $t('draft.any.versionCaption.draftVersion') }}</strong>
                  </template>
                </i18n>
              </template>
            </form-version-summary-item>
            <form-draft-checklist/>
          </template>
        </page-section>
        <page-section v-else condensed>
          <template #heading>
            <span>{{ $t('draft.none.title') }}</span>
          </template>
          <template #body>
            <p>{{ $t('draft.none.body') }}</p>
          </template>
        </page-section>
      </div>
    </div>
    <project-submission-options v-bind="submissionOptions"
      @hide="hideModal('submissionOptions')"/>
  </div>
</template>

<script>
import FormChecklist from './checklist.vue';
import FormDraftChecklist from '../form-draft/checklist.vue';
import FormOverviewRightNow from './overview/right-now.vue';
import FormVersionSummaryItem from '../form-version/summary-item.vue';
import PageSection from '../page/section.vue';
import modal from '../../mixins/modal';
import validateData from '../../mixins/validate-data';
import { loadAsyncComponent } from '../../util/async-components';
import { requestData } from '../../store/modules/request';

export default {
  name: 'FormOverview',
  components: {
    FormChecklist,
    FormDraftChecklist,
    FormOverviewRightNow,
    FormVersionSummaryItem,
    PageSection,
    ProjectSubmissionOptions: loadAsyncComponent('ProjectSubmissionOptions')
  },
  mixins: [
    modal({ submissionOptions: 'ProjectSubmissionOptions' }),
    validateData()
  ],
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
      submissionOptions: {
        state: false
      }
    };
  },
  // The component does not assume that this data will exist when the component
  // is created.
  computed: requestData(['form', 'formDraft'])
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#form-overview-draft {
  background-color: #ddd;
  margin-top: -$margin-top-page-body;
  padding-top: $margin-top-page-body;

  .page-section-heading > span:first-child {
    color: $color-accent-secondary;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    // This is a title shown above a section of the page.
    "checklist": "Checklist",
    "draft": {
      "none": {
        // This is a title shown above a section of the page.
        "title": "No Current Draft",
        "body": "There is not currently a Draft version of this Form. If you want to make changes to the Form or its Media Files, start by creating a Draft using the button above."
      },
      "any": {
        "versionCaption": {
          "full": "{draftVersion} of this Form.",
          "draftVersion": "Draft version"
        }
      }
    }
  }
}
</i18n>
