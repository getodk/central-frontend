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
  <modal id="field-key-revoke" :state="state" :hideable="!awaitingResponse"
    backdrop @hide="$emit('hide')">
    <template slot="title">Revoke User Access</template>
    <template slot="body">
      <div class="modal-introduction">
        <p>
          Are you sure you want to revoke access from the App User
          <strong>{{ fieldKey != null ? fieldKey.displayName : '' }}</strong>?
        </p>
        <p>
          Existing Submissions from this user will remain, but anybody relying
          on this user will have to create a new one to continue downloading
          Forms or uploading Submissions.
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
import request from '../../mixins/request';

export default {
  name: 'FieldKeyRevoke',
  mixins: [request()],
  props: {
    fieldKey: Object, // eslint-disable-line vue/require-default-prop
    state: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      awaitingResponse: false
    };
  },
  methods: {
    revoke() {
      // Backend ensures that the token is URL-safe.
      this.delete(`/sessions/${this.fieldKey.token}`)
        .then(() => {
          this.$emit('hide');
          this.$alert().blank();
          this.$emit('success');
        })
        .catch(() => {});
    }
  }
};
</script>
