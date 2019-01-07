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
  <modal :state="state" :hideable="!disabled" backdrop @hide="hide">
    <template slot="title">Create Form</template>
    <template slot="body">
      <div class="modal-introduction">
        <p>
          To create a Form, upload an XForms XML file. If you don’t already have
          one, there are <doc-link to="form-tools/">tools available</doc-link>
          to help you design your Form.
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
          <button :disabled="disabled" type="button" class="btn btn-primary"
            @click="clickFileInput">
            <span class="icon-folder-open"></span>choose one
          </button>
          to upload.
        </div>
        <div v-show="filename != null" id="form-new-filename"
          class="text-monospace">
          {{ filename }}
        </div>
      </div>
      <div class="modal-actions">
        <button id="form-new-create-button" :disabled="disabled" type="button"
          class="btn btn-primary" @click="create">
          Create <spinner :state="awaitingResponse"/>
        </button>
        <button :disabled="disabled" type="button" class="btn btn-link"
          @click="hide">
          Close
        </button>
      </div>
    </template>
  </modal>
</template>

<script>
import Form from '../../presenters/form';
import dropZone from '../../mixins/drop-zone';
import request from '../../mixins/request';

const NO_FILE_MESSAGE = 'Please choose a file.';

export default {
  name: 'FormNew',
  mixins: [
    dropZone({ keepAlive: false, eventNamespace: 'form-new' }),
    request()
  ],
  props: {
    projectId: {
      type: String,
      required: true
    },
    state: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      fileIsOverDropZone: false,
      requestId: null,
      reading: false,
      filename: null,
      xml: null
    };
  },
  computed: {
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
  mounted() {
    // Using a jQuery event handler rather than a Vue one in order to facilitate
    // testing: it is possible to mock a jQuery event but not a Vue event.
    $(this.$refs.input)
      .on('change.form-new', (event) => this.readFile(event.target.files));
  },
  beforeDestroy() {
    $(this.$refs.input).off('.form-new');
  },
  methods: {
    problemToAlert(problem) {
      if (problem.code === 400.5 && problem.details.table === 'forms' &&
        problem.details.fields.length === 2 &&
        problem.details.fields[0] === 'xmlFormId' &&
        problem.details.fields[1] === 'version')
        return 'A Form previously existed which had the same formId and version as the one you are attempting to create now. To prevent confusion, please change one or both and try creating the Form again.';
      return null;
    },
    hide() {
      this.$emit('hide');
      const alert = this.$alert();
      if (alert.type === 'info' && alert.message === NO_FILE_MESSAGE)
        alert.blank();
    },
    readFile(files) {
      if (files.length === 0) return;
      this.reading = true;
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        this.$alert().blank();
        this.filename = file.name;
        this.xml = event.target.result;
      };
      reader.onerror = () => {
        this.$alert().danger('Something went wrong while reading the file.');
        this.filename = null;
        this.xml = null;
      };
      reader.onabort = request.onerror;
      reader.onloadend = () => {
        this.$refs.input.value = '';
        this.reading = false;
      };
      reader.readAsText(file);
    },
    clickFileInput() {
      this.$refs.input.click();
    },
    ondrop(jQueryEvent) {
      this.readFile(jQueryEvent.originalEvent.dataTransfer.files);
    },
    create() {
      if (this.xml == null) {
        this.$alert().info(NO_FILE_MESSAGE);
        return;
      }
      const headers = { 'Content-Type': 'application/xml' };
      this.post(`/projects/${this.projectId}/forms`, this.xml, { headers })
        .then(({ data }) => {
          this.filename = null;
          this.xml = null;
          this.$emit('success', new Form(data));
        })
        .catch(() => {});
    }
  }
};
</script>

<style lang="sass">
@import '../../../assets/scss/variables';

$drop-zone-vpadding: 15px;

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
  margin-bottom: -$drop-zone-vpadding;
  margin-top: 10px;
  padding: 6px 0;
}
</style>
