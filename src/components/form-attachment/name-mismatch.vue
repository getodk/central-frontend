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
  <modal :state="state" backdrop hideable @hide="$emit('hide')">
    <template slot="title">
      <template v-if="attachment.exists">
        Replace File
      </template>
      <template v-else>
        Upload File
      </template>
    </template>
    <template slot="body">
      <div class="modal-introduction">
        <p>
          Are you sure you want to upload <strong>{{ file.name }}</strong> as
          <strong>{{ attachment.name }}</strong>?
        </p>
        <p>We are double-checking because the filenames do not match.</p>
      </div>
      <div class="modal-actions">
        <button class="btn btn-primary" type="button" @click="confirm">
          Yes, proceed
        </button>
        <button class="btn btn-link" type="button" @click="cancel">
          No, cancel
        </button>
      </div>
    </template>
  </modal>
</template>

<script>
import Modal from '../modal.vue';

export default {
  name: 'FormAttachmentNameMismatch',
  components: { Modal },
  props: {
    state: {
      type: Boolean,
      default: false
    },
    plannedUploads: {
      type: Array,
      required: true
    }
  },
  computed: {
    // Returning dummy values for `attachment` and `file` when
    // plannedUploads.length !== 1 in order to simplify the template.
    attachment() {
      return this.plannedUploads.length === 1
        ? this.plannedUploads[0].attachment
        : { name: '', exists: false };
    },
    file() {
      return this.plannedUploads.length === 1
        ? this.plannedUploads[0].file
        : { name: '' };
    }
  },
  methods: {
    confirm() {
      this.$emit('hide');
      this.$emit('confirm');
    },
    cancel() {
      this.$emit('hide');
      this.$emit('cancel');
    }
  }
};
</script>
