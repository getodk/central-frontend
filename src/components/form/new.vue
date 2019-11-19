<!--
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/opendatakit/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <modal :state="state" :hideable="!disabled" backdrop @hide="$emit('hide')">
    <template #title>Create Form</template>
    <template #body>
      <div v-show="warnings != null" id="form-new-warnings">
        <p>
          This XLSForm file can be used, but it has the following possible
          problems (conversion warnings):
        </p>
        <ul if="warnings != null">
          <!-- eslint-disable-next-line vue/require-v-for-key -->
          <li v-for="warning of warnings">{{ warning.trim() }}</li>
        </ul>
        <p>
          Please correct the problems and try again. If you are sure these
          problems can be ignored, click the button to create the Form anyway:
        </p>
        <p>
          <button type="button" class="btn btn-primary" :disabled="disabled"
            @click="create(true)">
            Create anyway <spinner :state="awaitingResponse"/>
          </button>
        </p>
      </div>
      <div class="modal-introduction">
        <p>
          To create a Form, upload an XForms XML file or an XLSForm Excel file.
          If you don&rsquo;t already have one, there are
          <doc-link to="form-tools/">tools available</doc-link> to help you
          design your Form.
        </p>
        <p>
          If you have media, you will be able to upload that on the next page,
          after the Form has been created.
        </p>
      </div>
      <div id="form-new-drop-zone" ref="dropZone" :class="dropZoneClass">
        <div>
          Drop a file here, or
          <input ref="input" type="file" class="hidden">
          <button type="button" class="btn btn-primary" :disabled="disabled"
            @click="clickFileInput">
            <span class="icon-folder-open"></span>choose one
          </button>
          to upload.
        </div>
        <div v-show="file != null" id="form-new-filename">
          {{ file != null ? file.name : '' }}
        </div>
      </div>
      <div class="modal-actions">
        <button id="form-new-create-button" type="button"
          class="btn btn-primary" :disabled="disabled" @click="create(false)">
          Create <spinner :state="awaitingResponse"/>
        </button>
        <button type="button" class="btn btn-link" :disabled="disabled"
          @click="$emit('hide')">
          Cancel
        </button>
      </div>
    </template>
  </modal>
</template>

<script>
import DocLink from '../doc-link.vue';
import Form from '../../presenters/form';
import dropZone from '../../mixins/drop-zone';
import request from '../../mixins/request';
import { isProblem } from '../../util/request';
import { requestData } from '../../store/modules/request';

const EXCEL_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel'
];

export default {
  name: 'FormNew',
  components: { DocLink },
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
      reading: false,
      xml: null,
      warnings: null
    };
  },
  computed: {
    ...requestData(['project']),
    // Returns true if modal actions (selecting a file, submitting the XML, or
    // hiding the modal) are disabled and false if not.
    disabled() {
      return this.reading || this.awaitingResponse;
    },
    dropZoneClass() {
      return {
        'form-new-disabled': this.disabled,
        'form-new-dragover': this.fileIsOverDropZone
      };
    }
  },
  watch: {
    state(state) {
      if (state) return;
      this.file = null;
      this.reading = false;
      this.xml = null;
      this.warnings = null;
      this.$refs.input.value = '';
    }
  },
  mounted() {
    // Using a jQuery event handler rather than a Vue one in order to facilitate
    // testing: it is possible to mock a jQuery event but not a Vue event.
    $(this.$refs.input).on('change.form-new', (event) => {
      this.processFile(event.target.files[0]);
    });
  },
  beforeDestroy() {
    $(this.$refs.input).off('.form-new');
  },
  methods: {
    processXLSForm(file) {
      this.$alert().blank();
      this.file = file;
      this.xml = null;
      this.warnings = null;
    },
    processXForm(file) {
      this.reading = true;
      const reader = new FileReader();
      const { currentRoute } = this.$store.state.router;
      reader.onload = (event) => {
        if (this.$store.state.router.currentRoute !== currentRoute) return;
        this.$alert().blank();
        this.file = file;
        this.xml = event.target.result;
      };
      reader.onerror = () => {
        if (this.$store.state.router.currentRoute !== currentRoute) return;
        this.$alert().danger('Something went wrong while reading the XForm XML file.');
        this.file = null;
        this.xml = null;
      };
      reader.onloadend = () => {
        if (this.$store.state.router.currentRoute !== currentRoute) return;
        this.reading = false;
        this.warnings = null;
        this.$refs.input.value = '';
      };
      reader.readAsText(file);
    },
    processFile(file) {
      if (EXCEL_TYPES.includes(file.type))
        this.processXLSForm(file);
      else
        this.processXForm(file);
    },
    clickFileInput() {
      this.$refs.input.click();
    },
    ondrop(jQueryEvent) {
      this.processFile(jQueryEvent.originalEvent.dataTransfer.files[0]);
    },
    create(ignoreWarnings) {
      if (this.file == null) {
        this.$alert().info('Please choose a file.');
        return;
      }

      const queryString = ignoreWarnings ? '?ignoreWarnings=true' : '';
      const url = `/projects/${this.project.id}/forms${queryString}`;

      const headers = {};
      if (this.xml != null) {
        headers['Content-Type'] = 'application/xml';
      } else {
        headers['Content-Type'] = this.file.type;
        headers['X-XlsForm-FormId-Fallback'] = this.file.name.replace(/\.xlsx?$/, '');
      }

      const { currentRoute } = this.$store.state.router;
      this.request({
        method: 'POST',
        url,
        headers,
        data: this.xml != null ? this.xml : this.file,
        validateProblem: ({ code }) => code === 400.16,
        problemToAlert: ({ code, details }) => {
          if (code === 400.15) return details.error;
          if (code === 409.3 && details.table === 'forms') {
            const { fields } = details;
            if (fields.length === 2 && fields[0] === 'projectId' &&
              fields[1] === 'xmlFormId') {
              const xmlFormId = details.values[1];
              return `A Form already exists in this Project with the Form ID of "${xmlFormId}".`;
            }
            if (fields.length === 3 && fields[0] === 'projectId' &&
              fields[1] === 'xmlFormId' && fields[2] === 'version')
              return 'A Form previously existed in this Project with the same Form ID and version as the Form you are attempting to create now. To prevent confusion, please change one or both and try creating the Form again.';
          }
          return null;
        }
      })
        .then(({ data }) => {
          if (isProblem(data)) {
            this.$alert().blank();
            this.warnings = data.details.warnings;
          } else {
            // The `forms` property of the project is now likely out-of-date.
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

#form-new-warnings {
  background-color: $color-warning;
  margin-bottom: 15px;
  padding: 15px;

  ul {
    margin-left: -5px;
    overflow-wrap: break-word;
    white-space: pre-wrap;
  }

  p:last-child {
    margin-bottom: 0;
  }
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
