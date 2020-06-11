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
  <modal :state="state" :hideable="!awaitingResponse" backdrop
    @hide="$emit('hide')">
    <template #title>{{ $t('title') }}</template>
    <template #body>
      <i18n v-if="user != null" tag="p" path="introduction.full"
        class="modal-introduction">
        <template #resetPassword>
          <strong>{{ $t('introduction.resetPassword') }}</strong>
        </template>
        <template #displayName>{{ user.displayName }}</template>
        <template #email>{{ user.email }}</template>
      </i18n>
      <div class="modal-actions">
        <button id="user-reset-password-button" :disabled="awaitingResponse"
          type="button" class="btn btn-primary" @click="resetPassword">
          {{ $t('action.resetPassword') }} <spinner :state="awaitingResponse"/>
        </button>
        <button :disabled="awaitingResponse" type="button" class="btn btn-link"
          @click="$emit('hide')">
          {{ $t('action.close') }}
        </button>
      </div>
    </template>
  </modal>
</template>

<script>
import Modal from '../modal.vue';
import Spinner from '../spinner.vue';
import request from '../../mixins/request';
import { noop } from '../../util/util';

export default {
  name: 'UserResetPassword',
  components: { Modal, Spinner },
  mixins: [request()],
  props: {
    state: {
      type: Boolean,
      default: false
    },
    user: Object // eslint-disable-line vue/require-default-prop
  },
  data() {
    return {
      awaitingResponse: false
    };
  },
  methods: {
    resetPassword() {
      const data = { email: this.user.email };
      this.post('/users/reset/initiate?invalidate=true', data)
        .then(() => {
          this.$emit('success', this.user);
        })
        .catch(noop);
    }
  }
};
</script>

<!-- eslint-disable vue/no-parsing-error -->
<i18n lang="json5">
{
  "en": {
    // This is the title at the top of a pop-up.
    "title": "Reset Password",
    "introduction": {
      "full": "Once you click {resetPassword} below, the password for the user “{displayName}” <{email}> will be immediately invalidated. An email will be sent to {email} with instructions on how to proceed.",
      "resetPassword": "Reset password"
    }
  }
}
</i18n>
<!-- eslint-enable vue/no-parsing-error -->
