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
    <template #title>{{ $t('title') }}</template>
    <template #body>
      <div class="modal-introduction">
        <i18n tag="p" path="introduction[0].full">
          <template #dragAndDrop>
            <strong>{{ $t('introduction[0].dragAndDrop') }}</strong>
          </template>
        </i18n>
        <i18n tag="p" path="introduction[1].full">
          <template #clickHere>
            <input v-show="false" ref="input" type="file" multiple>
            <a ref="link" href="#" role="button" @click.prevent="clickInput">
              <span class="icon-folder-open"></span>
              <span>{{ $t('introduction[1].clickHere') }}</span>
            </a>
          </template>
        </i18n>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-primary" @click="$emit('hide')">
          {{ $t('action.ok') }}
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

<i18n lang="json5">
{
  "en": {
    "title": "Upload Files",
    "introduction": [
      {
        "full": "To upload files, you can {dragAndDrop} one or more files onto the table on this page.",
        "dragAndDrop": "drag and drop"
      },
      {
        "full": "If you would rather select files from a prompt, ensure that their names match the ones in the table and then {clickHere}.",
        "clickHere": "click here to choose"
      }
    ]
  }
}
</i18n>
