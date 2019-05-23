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
          <input ref="email" v-model.trim="email" type="email"
            class="form-control" placeholder="Email address *" required>
          <span class="form-label">Email address *</span>
        </label>
        <label class="form-group">
          <input v-model.trim="displayName" type="text" class="form-control"
            placeholder="Display name">
          <span class="form-label">Display name</span>
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
import { noop } from '../../util/util';

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
      email: '',
      displayName: ''
    };
  },
  watch: {
    state(state) {
      if (state) return;
      this.email = '';
      this.displayName = '';
    }
  },
  methods: {
    focusEmailInput() {
      this.$refs.email.focus();
    },
    submit() {
      const postData = { email: this.email };
      if (this.displayName !== '') postData.displayName = this.displayName;
      this.post('/users', postData)
        .then(response => {
          this.$emit('success', response.data);
        })
        .catch(noop);
    }
  }
};
</script>
