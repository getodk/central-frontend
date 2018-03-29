<!--
Copyright 2017 Super Adventure Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/nafundi/super-adventure/blob/master/NOTICE.

This file is part of Super Adventure. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of Super Adventure,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <modal ref="modal" :state="state" @hide="hide" backdrop
    :hideable="!awaitingResponse">
    <template slot="title">Create Form</template>
    <template slot="body">
      <alert v-bind="alert" @close="alert.state = false"/>
      <div class="modal-introduction">
        <p>To create a form, upload an XForms XML file.</p>
        <p>
          If you don’t already have one, there are
          <doc-link>tools available</doc-link> to help you design your form.
        </p>
      </div>
      <div ref="dropZone" id="drop-zone" :class="dropZoneClass">
        <div :style="pointerEvents">
          Drop a file here, or
          <input type="file" ref="input" class="hidden">
          <button type="button" class="btn btn-primary" :disabled="!droppable"
            @click="clickFileButton">
            <span class="icon-folder-open"></span> choose one
          </button>
          to upload.
        </div>
        <div id="form-new-filename" :style="pointerEvents">{{ filename }}</div>
      </div>
      <div class="modal-actions">
        <button type="button" id="form-new-create-button"
          class="btn btn-primary" :disabled="awaitingResponse" @click="create">
          Create <spinner :state="awaitingResponse"/>
        </button>
        <button type="button" class="btn btn-link" :disabled="awaitingResponse"
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
    clickFileButton() {
      this.$refs.input.click();
      // Focus the modal rather than blurring the button so that the escape key
      // still hides the modal.
      this.$refs.modal.$el.focus();
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
        .then(form => {
          this.$emit('hide');
          // Wait for the modal to hide.
          this.$nextTick(() => {
            const name = form.name || form.xmlFormId;
            this.$alert = alert.success(`The form “${name}” was created successfully.`);
            this.$router.push(`/forms/${form.xmlFormId}/submissions`);
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

  #form-new-filename {
    font-family: Menlo, Monaco, Consolas, "Courier New", monospace;
  }
}
</style>
