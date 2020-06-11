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

<!-- A modal that can be used to create a new form or to upload a new form
definition for an existing form -->
<template>
  <modal id="form-new" :state="state" :hideable="!awaitingResponse" backdrop
    @hide="$emit('hide')">
    <template #title>
      {{ formDraft == null ? $t('title.create') : $t('title.update') }}
    </template>
    <template #body>
      <div v-show="warnings != null" class="modal-warnings">
        <p>{{ $t('warningsText[0]') }}</p>
        <ul if="warnings != null">
          <!-- eslint-disable-next-line vue/require-v-for-key -->
          <li v-for="warning of warnings">{{ warning.trim() }}</li>
        </ul>
        <p>
          {{ $t('warningsText[1]') }}
          {{ formDraft == null ? $t('warningsText[2].create') : $t('warningsText[2].update') }}
        </p>
        <p>
          <button type="button" class="btn btn-primary"
            :disabled="awaitingResponse" @click="upload(true)">
            {{ $t('action.uploadAnyway') }} <spinner :state="awaitingResponse"/>
          </button>
        </p>
      </div>
      <div class="modal-introduction">
        <p>
          {{ formDraft == null ? $t('introduction[0].create') : $t('introduction[0].update') }}
          <i18n :tag="false" path="introduction[1].full">
            <template #tools>
              <doc-link to="form-tools/">{{ $t('introduction[1].tools') }}</doc-link>
            </template>
          </i18n>
        </p>
        <p v-if="formDraft == null">{{ $t('introduction[2]') }}</p>
      </div>
      <div id="form-new-drop-zone" ref="dropZone" :class="dropZoneClass">
        <i18n tag="div" path="dropZone.full">
          <template #chooseOne>
            <input v-show="false" ref="input" type="file">
            <button type="button" class="btn btn-primary"
              :disabled="awaitingResponse" @click="$refs.input.click()">
              <span class="icon-folder-open"></span>{{ $t('dropZone.chooseOne') }}
            </button>
          </template>
        </i18n>
        <div v-show="file != null" id="form-new-filename">
          {{ file != null ? file.name : '' }}
        </div>
      </div>
      <div class="modal-actions">
        <button id="form-new-upload-button" type="button"
          class="btn btn-primary" :disabled="awaitingResponse"
          @click="upload(false)">
          {{ $t('action.upload') }} <spinner :state="awaitingResponse"/>
        </button>
        <button type="button" class="btn btn-link" :disabled="awaitingResponse"
          @click="$emit('hide')">
          {{ $t('action.cancel') }}
        </button>
      </div>
    </template>
  </modal>
</template>

<script>
import DocLink from '../doc-link.vue';
import Form from '../../presenters/form';
import Modal from '../modal.vue';
import Spinner from '../spinner.vue';
import dropZone from '../../mixins/drop-zone';
import request from '../../mixins/request';
import { apiPaths, isProblem } from '../../util/request';
import { requestData } from '../../store/modules/request';

export default {
  name: 'FormNew',
  components: { DocLink, Modal, Spinner },
  mixins: [
    dropZone({ keepAlive: false, eventNamespace: 'form-new' }),
    request()
  ],
  props: {
    state: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      fileIsOverDropZone: false,
      awaitingResponse: false,
      file: null,
      warnings: null
    };
  },
  computed: {
    // The component does not assume that this data will exist when the
    // component is created.
    ...requestData(['project', { key: 'formDraft', getOption: true }]),
    disabled() {
      return this.awaitingResponse;
    },
    dropZoneClass() {
      return {
        'form-new-disabled': this.awaitingResponse,
        'form-new-dragover': this.fileIsOverDropZone
      };
    },
    // Returns the inferred content type of the file based on its extension. (We
    // first tried using this.file.type rather than inferring the content type,
    // but that didn't work in Edge.)
    contentType() {
      const { name } = this.file;
      if (name.length >= 5 && name.slice(-5) === '.xlsx')
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      if (name.length >= 4 && name.slice(-4) === '.xls')
        return 'application/vnd.ms-excel';
      return 'application/xml';
    }
  },
  watch: {
    state(state) {
      if (state) return;
      this.file = null;
      this.warnings = null;
      this.$refs.input.value = '';
    }
  },
  mounted() {
    // Using a jQuery event handler rather than a Vue one in order to facilitate
    // testing: it is possible to mock a jQuery event but not a Vue event.
    $(this.$refs.input).on('change.form-new', (event) => {
      this.afterFileSelection(event.target.files[0]);
    });
  },
  beforeDestroy() {
    $(this.$refs.input).off('.form-new');
  },
  methods: {
    afterFileSelection(file) {
      this.$alert().blank();
      this.file = file;
      this.warnings = null;
    },
    ondrop(jQueryEvent) {
      this.afterFileSelection(jQueryEvent.originalEvent.dataTransfer.files[0]);
    },
    upload(ignoreWarnings) {
      if (this.file == null) {
        this.$alert().info(this.$t('alert.fileRequired'));
        return;
      }

      const query = ignoreWarnings ? { ignoreWarnings } : null;
      const headers = { 'Content-Type': this.contentType };
      if (this.contentType !== 'application/xml')
        headers['X-XlsForm-FormId-Fallback'] = this.file.name.replace(/\.xlsx?$/, '');
      const { currentRoute } = this.$store.state.router;
      this.request({
        method: 'POST',
        url: this.formDraft == null
          ? apiPaths.forms(this.project.id, query)
          : apiPaths.formDraft(this.project.id, this.formDraft.xmlFormId, query),
        headers,
        data: this.file,
        fulfillProblem: ({ code }) => code === 400.16,
        problemToAlert: ({ code, details }) => {
          if (code === 400.15)
            return this.$t('problem.400_15', details);
          if (code === 409.3 && details.table === 'forms') {
            const { fields } = details;
            if (fields.length === 2 && fields[0] === 'projectId' &&
              fields[1] === 'xmlFormId') {
              const xmlFormId = details.values[1];
              return this.$t('problem.409_3', { xmlFormId });
            }
          }
          if (code === 400.8 && details.field === 'xmlFormId') {
            return this.$t('problem.400_8', {
              expected: this.formDraft.xmlFormId,
              actual: details.value
            });
          }
          return null;
        }
      })
        .then(({ data }) => {
          if (isProblem(data)) {
            this.$alert().blank();
            this.warnings = data.details.warnings;
          } else {
            // The `forms` property of the project may now be out-of-date.
            this.$emit('success', new Form(data));
          }
        })
        .catch(() => {
          if (this.$store.state.router.currentRoute === currentRoute)
            this.warnings = null;
        });
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

$drop-zone-vpadding: 15px;

#form-new .modal-warnings ul {
  overflow-wrap: break-word;
  white-space: pre-wrap;
}

#form-new-drop-zone {
  background-color: $color-panel-input-background;
  border: 1px dashed $color-subpanel-border;
  padding-bottom: $drop-zone-vpadding;
  padding-top: $drop-zone-vpadding;
  text-align: center;

  &.form-new-dragover {
    opacity: 0.65;
  }

  &.form-new-disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }
}

#form-new-filename {
  background-color: $color-input-background;
  border-top: 1px solid #ddd;
  font-family: $font-family-monospace;
  margin-bottom: -$drop-zone-vpadding;
  margin-top: 10px;
  padding: 6px 0;
}
</style>

<i18n lang="json5">
{
  "en": {
    // This is the title at the top of a pop-up.
    "title": {
      "create": "Create Form",
      "update": "Upload New Form Definition"
    },
    "introduction": [
      {
        "create": "To create a Form, upload an XForms XML file or an XLSForm Excel file.",
        "update": "To update the Draft, upload an XForms XML file or an XLSForm Excel file."
      },
      {
        "full": "If you don’t already have one, there are {tools} to help you design your Form.",
        "tools": "tools available"
      },
      "If you have media, you will be able to upload that on the next page, after the Form has been created."
    ],
    "dropZone": {
      "full": "Drop a file here, or {chooseOne} to upload.",
      "chooseOne": "choose one"
    },
    "action": {
      "upload": "Upload",
      "uploadAnyway": "Upload anyway"
    },
    "alert": {
      "fileRequired": "Please choose a file."
    },
    "problem": {
      "400_8": "The Form definition you have uploaded does not appear to be for this Form. It has the wrong formId (expected “{expected}”, got “{actual}”).",
      "400_15": "The XLSForm could not be converted: {error}",
      "409_3": "A Form already exists in this Project with the Form ID of “{xmlFormId}”."
    },
    "warningsText": [
      "This XLSForm file can be used, but it has the following possible problems (conversion warnings):",
      "Please correct the problems and try again.",
      {
        "create": "If you are sure these problems can be ignored, click the button to create the Form anyway:",
        "update": "If you are sure these problems can be ignored, click the button to update the Draft anyway:"
      }
    ]
  }
}
</i18n>
