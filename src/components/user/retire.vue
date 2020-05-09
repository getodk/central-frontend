<!--
Copyright 2019 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <modal id="user-retire" :state="state" :hideable="!awaitingResponse" backdrop
    @hide="$emit('hide')">
    <template #title>{{ $t('title') }}</template>
    <template #body>
      <div class="modal-introduction">
        <p v-if="user != null">{{ $t('introduction[0]', user) }}</p>
        <i18n tag="p" :path="$tPath('introduction[1].full')">
          <template #noUndo>
            <strong>{{ $t('introduction[1].noUndo') }}</strong>
          </template>
        </i18n>
        <p>{{ $t('introduction[2]') }}</p>
      </div>
      <div class="modal-actions">
        <button :disabled="awaitingResponse" type="button"
          class="btn btn-danger" @click="retire">
          {{ $t('action.yesConfirm') }} <spinner :state="awaitingResponse"/>
        </button>
        <button :disabled="awaitingResponse" type="button" class="btn btn-link"
          @click="$emit('hide')">
          {{ $t('action.noCancel') }}
        </button>
      </div>
    </template>
  </modal>
</template>

<script>
import Modal from '../modal.vue';
import Spinner from '../spinner.vue';
import request from '../../mixins/request';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';

export default {
  name: 'UserRetire',
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
    retire() {
      this.delete(apiPaths.user(this.user.id))
        .then(() => {
          this.$emit('success', this.user);
        })
        .catch(noop);
    }
  }
};
</script>
