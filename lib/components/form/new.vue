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
  <modal :state="state" :hideable="!awaitingResponse" backdrop @hide="hide">
    <template slot="title">Create Form</template>
    <template slot="body">
      <alert v-bind="alert" @close="alert.state = false"/>
      <div class="modal-introduction">
        <p>To create a form, upload an XForms XML file.</p>
        <p>
          If you don’t already have one, there are
          <doc-link to="form-tools/">tools available</doc-link> to help you
          design your form.
        </p>
      </div>
      <div id="drop-zone" ref="dropZone" :class="dropZoneClass">
        <div :style="pointerEvents">
          Drop a file here, or
          <input ref="input" type="file" class="hidden">
          <button :disabled="!droppable" type="button" class="btn btn-primary"
            @click="clickFileInput">
            <span class="icon-folder-open"></span> choose one
          </button>
          to upload.
        </div>
        <div :style="pointerEvents" class="text-monospace">{{ filename }}</div>
      </div>
      <div class="modal-actions">
        <button id="form-new-create-button" :disabled="awaitingResponse"
          type="button" class="btn btn-primary" @click="create">
          Create <spinner :state="awaitingResponse"/>
        </button>
        <button :disabled="awaitingResponse" type="button" class="btn btn-link"
          @click="hide">
          Close
        </button>
      </div>
    </template>
  </modal>
</template>

<script>
import alert from '../../mixins/alert';
import request from '../../mixins/request';

const NO_FILE_MESSAGE = 'Please choose a file.';

export default {
  name: 'FormNew',
  mixins: [alert(), request()],
  props: {
    state: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      alert: alert.blank(),
      requestId: null,
      // true if a dragged file is over the drop zone and false if not.
      isOverDropZone: false,
      reading: false,
      filename: '',
      xml: null
    };
  },
  computed: {
    droppable() {
      return !(this.reading || this.awaitingResponse);
    },
    dropZoneClass() {
      return {
        'text-center': true,
        droppable: this.droppable,
        dragover: this.isOverDropZone
      };
    },
    // Used to prevent child elements of #drop-zone from triggering dragleave
    // events upon hover. Does not work for IE9 or 10.
    pointerEvents() {
      return this.isOverDropZone ? { 'pointer-events': 'none' } : {};
    }
  },
  mounted() {
    $(this.$refs.input)
      .on('change.app-form-new', (event) => this.readFile(event.target.files));
    $(this.$refs.dropZone)
      .on('dragover.app-form-new', this.dragover)
      .on('dragleave.app-form-new', this.dragleave)
      .on('drop.app-form-new', this.drop);
  },
  beforeDestroy() {
    $(this.$refs.input).off('.app-form-new');
    $(this.$refs.dropZone).off('.app-form-new');
  },
  methods: {
    problemToAlert(problem) {
      if (problem.code === 400.5 && problem.details.table === 'forms' &&
        problem.details.fields.length === 2 &&
        problem.details.fields[0] === 'xmlFormId' &&
        problem.details.fields[1] === 'version')
        return 'A form previously existed which had the same formId and version as the one you are attempting to create now. To prevent confusion, please change one or both and try creating the form again.';
      return null;
    },
    hide() {
      this.$emit('hide');
      if (this.alert.type === 'info' && this.alert.message === NO_FILE_MESSAGE)
        this.alert = alert.blank();
    },
    readFile(files) {
      if (files.length === 0) return;
      const file = files[0];
      const reader = new FileReader();
      reader.onloadstart = () => {
        this.reading = true;
      };
      reader.onload = (event) => {
        this.alert = alert.blank();
        this.filename = file.name;
        this.xml = event.target.result;
      };
      reader.onerror = () => {
        this.alert = alert.danger('Something went wrong while reading the file.');
        this.filename = '';
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
    dragover(event) {
      event.preventDefault();
      // Putting this line in a dragenter listener did not work. Is it possible
      // that a child element of #drop-zone could trigger a dragleave event
      // before the dragenter listener is called?
      this.isOverDropZone = true;
      // eslint-disable-next-line no-param-reassign
      if (this.droppable) event.originalEvent.dataTransfer.dropEffect = 'copy';
    },
    dragleave() {
      this.isOverDropZone = false;
    },
    drop(event) {
      event.preventDefault();
      if (this.droppable) this.readFile(event.originalEvent.dataTransfer.files);
      this.isOverDropZone = false;
    },
    checkStateBeforeRequest() {
      if (this.xml == null) {
        this.alert = alert.info(NO_FILE_MESSAGE);
        return false;
      } else if (this.reading) {
        this.alert = alert.info('The file is still being processed.');
        return false;
      }
      return true;
    },
    create() {
      if (!this.checkStateBeforeRequest()) return;
      const headers = { 'Content-Type': 'application/xml' };
      this
        .post('/forms', this.xml, { headers })
        .then(({ data }) => {
          this.$emit('hide');
          // Wait for the modal to hide.
          this.$nextTick(() => {
            const form = data;
            const name = form.name || form.xmlFormId;
            this.$alert = alert.success(`The form “${name}” was created successfully.`);
            this.$router.push(`/forms/${form.xmlFormId}`);
          });
        })
        .catch(() => {});
    }
  }
};
</script>

<style lang="sass">
@import '../../../assets/scss/variables';

#drop-zone {
  background-color: $color-input-background;
  border: 1px dashed $color-subpanel-border;

  &.dragover {
    opacity: 0.65;
  }

  &:not(.droppable) {
    cursor: not-allowed;
    opacity: 0.65;
  }

  div {
    margin-bottom: 5px;
    margin-top: 5px;
  }
}
</style>
