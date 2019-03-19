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
  <modal id="user-new" :state="state" :hideable="!awaitingResponse" backdrop
    @hide="$emit('hide')" @shown="focusEmailInput">
    <template slot="title">Create Web User</template>
    <template slot="body">
      <p class="modal-introduction">
        Once you create this account, the email address you provide will be sent
        instructions on how to set a password and proceed.
      </p>
      <form @submit.prevent="submit">
        <label class="form-group">
          <select :disabled="awaitingResponse" class="form-control">
            <option>Administrator</option>
            <option disabled>More options available soon</option>
          </select>
          <span class="form-label">Role *</span>
        </label>
        <label class="form-group">
          <input ref="email" v-model.trim="email" :disabled="awaitingResponse"
            type="email" class="form-control" placeholder="Email address *"
            required>
          <span class="form-label">Email address *</span>
        </label>
        <div class="modal-actions">
          <button :disabled="awaitingResponse" type="submit"
            class="btn btn-primary">
            Create <spinner :state="awaitingResponse"/>
          </button>
          <button :disabled="awaitingResponse" type="button"
            class="btn btn-link" @click="$emit('hide')">
            Cancel
          </button>
        </div>
      </form>
    </template>
  </modal>
</template>

<script>
import request from '../../mixins/request';

export default {
  name: 'UserNew',
  mixins: [request()],
  props: {
    state: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      awaitingResponse: false,
      email: ''
    };
  },
  watch: {
    state(state) {
      if (!state) this.email = '';
    }
  },
  methods: {
    focusEmailInput() {
      this.$refs.email.focus();
    },
    submit() {
      this
        .post('/users', { email: this.email })
        .then(({ data }) => {
          this.$emit('success', data);
        })
        .catch(() => {});
    }
  }
};
</script>
