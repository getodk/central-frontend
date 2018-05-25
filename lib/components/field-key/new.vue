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
  <modal id="field-key-new" :state="state" :hideable="!awaitingResponse"
    backdrop @hide="$emit('hide')" @shown="focusField">
    <template slot="title">Create App User</template>
    <template slot="body">
      <alert v-bind="alert" @close="alert.state = false"/>
      <form @submit.prevent="submit">
        <label class="form-group">
          <input ref="nickname" v-model.trim="nickname"
            :disabled="awaitingResponse" class="form-control"
            placeholder="Nickname *" required>
          <span class="form-label">Nickname *</span>
        </label>
        <div class="modal-actions">
          <button :disabled="awaitingResponse" type="submit"
            class="btn btn-primary">
            Create <spinner :state="awaitingResponse"/>
          </button>
          <button :disabled="awaitingResponse" type="button"
            class="btn btn-link" @click="$emit('hide')">
            Close
          </button>
        </div>
      </form>
    </template>
  </modal>
</template>

<script>
import alert from '../../mixins/alert';
import request from '../../mixins/request';

export default {
  name: 'FieldKeyNew',
  mixins: [alert(), request()],
  props: {
    state: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      alert: alert.blank(),
      requestId: null,
      nickname: ''
    };
  },
  methods: {
    focusField() {
      this.$refs.nickname.focus();
    },
    submit() {
      this
        .post('/field-keys', { displayName: this.nickname })
        .then(({ data }) => {
          this.$emit('hide');
          this.alert = alert.blank();
          this.nickname = '';
          this.$emit('success', data);
        })
        .catch(() => {});
    }
  }
};
</script>
