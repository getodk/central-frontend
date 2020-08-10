<!--
Copyright 2020 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <tr :class="htmlClass">
    <td class="display-name">
      <span :title="publicLink.displayName">{{ publicLink.displayName }}</span>
    </td>
    <td class="multiple">
      {{ publicLink.once ? $t('common.no') : $t('common.yes') }}
    </td>
    <td class="access-link">
      <template v-if="publicLink.token == null">{{ $t('revoked') }}</template>
      <template v-else-if="form != null">
        <selectable v-if="enketoId != null">{{ url }}</selectable>
        <span v-else class="unavailable" :title="$t('unavailable.title')">
          <span>{{ $t('unavailable.text') }}</span>
          <span class="icon-question-circle"></span>
        </span>
      </template>
    </td>
    <td>
      <button v-if="publicLink.token != null" type="button"
        class="btn btn-danger" @click="$emit('revoke', publicLink)">
        <span class="icon-times-circle"></span>{{ $t('action.revoke') }}&hellip;
      </button>
    </td>
  </tr>
</template>

<script>
import Selectable from '../selectable.vue';
import { requestData } from '../../store/modules/request';

export default {
  name: 'PublicLinkRow',
  components: { Selectable },
  props: {
    publicLink: {
      type: Object,
      required: true
    },
    highlighted: Number // eslint-disable-line vue/require-default-prop
  },
  computed: {
    // The component does not assume that this data will exist when the
    // component is created.
    ...requestData(['form']),
    htmlClass() {
      return {
        'public-link-row': true,
        success: this.publicLink.id === this.highlighted
      };
    },
    enketoId() {
      return this.publicLink.once ? this.form.enketoOnceId : this.form.enketoId;
    },
    url() {
      return `${window.location.origin}/_/single/${this.enketoId}?st=${this.publicLink.token}`;
    }
  }
};
</script>

<style lang="scss">
.public-link-row {
  .table tbody & td { vertical-align: middle; }

  .display-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .unavailable { cursor: help; }
  .icon-question-circle { margin-left: 5px; }
}
</style>

<i18n lang="json5">
{
  "en": {
    "action": {
      "revoke": "Revoke"
    },
    // This text is shown for a Public Access Link that has been revoked. The
    // text appears on its own and is not part of a longer sentence.
    "revoked": "Revoked",
    "unavailable": {
      // This text is shown for a Public Access Link that is not available yet.
      "text": "Not available yet",
      "title": "Public Access Link is not available yet. It has not finished being processed. Please refresh later and try again."
    }
  }
}
</i18n>
