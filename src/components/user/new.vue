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
  <modal id="user-new" :state="state" :hideable="!awaitingResponse" backdrop
    @hide="$emit('hide')" @shown="focusEmailInput">
    <template #title>{{ $t('title') }}</template>
    <template #body>
      <p class="modal-introduction">{{ $t('introduction') }}</p>
      <form @submit.prevent="submit">
        <form-group ref="email" v-model.trim="email" type="email"
          :placeholder="$t('field.email')" required autocomplete="off"/>
        <form-group v-model.trim="displayName" type="text"
          :placeholder="$t('field.displayName')" autocomplete="off"/>
        <div class="modal-actions">
          <button :disabled="awaitingResponse" type="submit"
            class="btn btn-primary">
            {{ $t('action.create') }} <spinner :state="awaitingResponse"/>
          </button>
          <button :disabled="awaitingResponse" type="button"
            class="btn btn-link" @click="$emit('hide')">
            {{ $t('action.cancel') }}
          </button>
        </div>
      </form>
    </template>
  </modal>
</template>

<script>
import FormGroup from '../form-group.vue';
import Modal from '../modal.vue';
import Spinner from '../spinner.vue';
import request from '../../mixins/request';
import { noop } from '../../util/util';

export default {
  name: 'UserNew',
  components: { FormGroup, Modal, Spinner },
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

<i18n lang="json5">
{
  "en": {
    // This is the title at the top of a pop-up.
    "title": "Create Web User",
    "introduction": "Once you create this account, the email address you provide will be sent instructions on how to set a password and proceed."
  }
}
</i18n>
