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
  <modal id="field-key-revoke" :state="state" :hideable="!awaitingResponse"
    backdrop @hide="$emit('hide')">
    <template slot="title">Revoke Key</template>
    <template slot="body">
      <alert v-bind="alert" @close="alert.state = false"/>
      <div class="modal-introduction">
        <p>
          Are you sure you want to revoke the field key
          <strong>{{ fieldKey.displayName }}</strong>?
        </p>
        <p>
          Existing submissions using this key will remain, but anybody relying
          on this key will have to obtain a new one to continue downloading
          forms or uploading submissions.
        </p>
        <p>This action cannot be undone.</p>
      </div>
      <div class="modal-actions">
        <button :disabled="awaitingResponse" type="button"
          class="btn btn-danger" @click="revoke">
          Yes, proceed <spinner :state="awaitingResponse"/>
        </button>
        <button :disabled="awaitingResponse" type="button" class="btn btn-link"
          @click="$emit('hide')">
          No, cancel
        </button>
      </div>
    </template>
  </modal>
</template>

<script>
import alert from '../../mixins/alert';
import request from '../../mixins/request';

export default {
  name: 'FieldKeyRevoke',
  mixins: [alert(), request()],
  props: {
    state: {
      type: Boolean,
      default: false
    },
    fieldKey: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      alert: alert.blank(),
      requestId: null
    };
  },
  methods: {
    revoke() {
      const encodedToken = encodeURIComponent(this.fieldKey.token);
      this
        .delete(`/sessions/${encodedToken}`)
        .then(() => {
          this.$emit('hide');
          this.alert = alert.blank();
          this.$emit('success');
        })
        .catch(() => {});
    }
  }
};
</script>
