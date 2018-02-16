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
  <modal :state="state" @hide="$emit('hide')">
    <template slot="title">Reset Password</template>
    <template slot="body">
      <alert v-bind="alert" @close="alert.state = false"/>
      <p>
        Once you click <strong>Reset Password</strong> below, the password for
        {{ user.email }} will be immediately invalidated. An email will be sent
        to {{ user.email }} with instructions on how to proceed.
      </p>
      <div>
        <button type="button" id="user-reset-password-button"
          class="btn btn-primary" :disabled="awaitingResponse"
          @click="resetPassword">
          Reset Password <spinner :state="awaitingResponse"/>
        </button>
        <button type="button" class="btn btn-default" @click="$emit('hide')">
          Close
        </button>
      </div>
    </template>
  </modal>
</template>

<script>
import alert from '../../mixins/alert';
import request from '../../mixins/request';

export default {
  name: 'UserResetPassword',
  mixins: [alert(), request()],
  props: {
    state: {
      type: Boolean,
      default: false
    },
    user: {
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
    resetPassword() {
      const data = { email: this.user.email };
      this
        .post('/users/reset/initiate?invalidate=true', data)
        .then(() => {
          this.$emit('hide');
          this.$emit('success');
        })
        .catch(() => {});
    }
  }
};
</script>
