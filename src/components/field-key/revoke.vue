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
  <modal id="field-key-revoke" :state="state" :hideable="!awaitingResponse"
    backdrop @hide="$emit('hide')">
    <template #title>{{ $t('title') }}</template>
    <template #body>
      <div class="modal-introduction">
        <i18n tag="p" path="introduction[0]">
          <template #displayName>
            <strong>{{ fieldKey != null ? fieldKey.displayName : '' }}</strong>
          </template>
        </i18n>
        <p>{{ $t('introduction[1]') }}</p>
        <p>{{ $t('introduction[2]') }}</p>
      </div>
      <div class="modal-actions">
        <button :disabled="awaitingResponse" type="button"
          class="btn btn-danger" @click="revoke">
          {{ $t('action.yesProceed') }} <spinner :state="awaitingResponse"/>
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
  name: 'FieldKeyRevoke',
  components: { Modal, Spinner },
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
      this.delete(apiPaths.session(this.fieldKey.token))
        .then(() => {
          this.$emit('success', this.fieldKey);
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
    "title": "Revoke User Access",
    "introduction": [
      // {displayName} is formatted in bold.
      "Are you sure you want to revoke access from the App User {displayName}?",
      "Existing Submissions from this user will remain, but anybody relying on this user will have to create a new one to continue downloading Forms or uploading Submissions.",
      "This action cannot be undone."
    ]
  }
}
</i18n>
