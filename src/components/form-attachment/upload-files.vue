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
  <modal id="form-attachment-upload-files" :state="state" backdrop hideable
    @hide="$emit('hide')" @shown="focusLink">
    <template slot="title">Upload Files</template>
    <template slot="body">
      <div class="modal-introduction">
        <p>
          To upload files, you can <strong>drag and drop</strong> one or more
          files onto the table on this page.
        </p>
        <p>
          If you would rather select files from a prompt, ensure that their
          names match the ones in the table and then
          <input ref="input" type="file" class="hidden" multiple>
          <a ref="link" href="#" role="button" @click.prevent="clickInput">
            <span class="icon-folder-open"></span>click here to choose</a>.
        </p>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-primary" @click="$emit('hide')">
          Okay
        </button>
      </div>
    </template>
  </modal>
</template>

<script>
import Modal from '../modal.vue';

export default {
  name: 'FormAttachmentUploadFiles',
  components: { Modal },
  props: {
    state: {
      type: Boolean,
      default: false
    }
  },
  mounted() {
    // Using a jQuery event handler rather than a Vue one in order to facilitate
    // testing: it is possible to mock a jQuery event but not a Vue event.
    $(this.$refs.input).on('change.form-attachment-upload-files', (event) =>
      this.$emit('select', event.target.files));
  },
  beforeDestroy() {
    $(this.$refs.input).off('.form-attachment-upload-files');
  },
  methods: {
    focusLink() {
      $(this.$refs.link).focus();
    },
    clickInput() {
      $(this.$refs.input).click();
    }
  }
};
</script>
