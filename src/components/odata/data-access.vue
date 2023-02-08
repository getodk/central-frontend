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
  <span id="odata-access">
    <a class="btn btn-default"
      href="https://odkcentral.docs.apiary.io/#reference/odata-endpoints"
      target="_blank" rel="noopener">
      <span class="icon-plug"></span>{{ $t('action.apiAccess') }}
    </a>
    <button id="odata-access-analyze-button" type="button"
      class="btn btn-default" :aria-disabled="analyzeDisabled"
      v-tooltip.aria-describedby="analyzeDisabled ? $t('analyzeDisabled') : null"
      @click="$emit('analyze')">
      <span class="icon-bar-chart"></span>{{ $t('action.analyze') }}&hellip;
    </button>
  </span>
</template>

<script>
import { useRequestData } from '../../request-data';

export default {
  name: 'ODataAccess',
  props: {
    formVersion: Object
  },
  emits: ['analyze'],
  setup() {
    // The component does not assume that this data will exist when the
    // component is created.
    const { keys } = useRequestData();
    return { keys };
  },
  computed: {
    analyzeDisabled() {
      // If an encrypted form has no submissions, then there will never be
      // decrypted submissions available to OData (as long as the form remains
      // encrypted).
      if (this.formVersion.dataExists && this.formVersion.keyId != null &&
        this.formVersion.submissions === 0)
        return true;
      if (this.keys != null && this.keys.length !== 0) return true;
      return false;
    }
  }
};
</script>

<style lang="scss">
#odata-access-analyze-button { margin-left: 5px; }
</style>

<i18n lang="json5">
{
  "en": {
    "action": {
      "apiAccess": "API access",
      "analyze": "Analyze via OData"
    },
    "analyzeDisabled": "OData access is unavailable due to Form encryption"
  }
}
</i18n>
