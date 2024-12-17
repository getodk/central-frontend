<!--
Copyright 2024 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <modal id="central-version" :state="state" hideable size="large" backdrop
    @hide="$emit('hide')">
    <template #title>{{ $t('title') }}</template>
    <template #body>
      <div class="modal-introduction">
        <p>{{ $t('shortVersion', { version: centralVersion.currentVersion }) }}</p>
        <p>{{ $t('longVersion') }}</p>
        <pre><code><selectable wrap>{{ centralVersion.versionText }}</selectable></code></pre>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-primary" @click="$emit('hide')">
          {{ $t('action.close') }}
        </button>
      </div>
    </template>
  </modal>
</template>

<script setup>
import Modal from './modal.vue';
import Selectable from './selectable.vue';

import useCentralVersion from '../composables/central-version';

defineOptions({
  name: 'CentralVersion'
});
defineProps({
  state: Boolean
});
defineEmits(['hide']);

const centralVersion = useCentralVersion();
</script>

<style lang="scss">
#central-version {
  .loading { min-height: 120px; }
}
</style>

<i18n lang="json5">
{
  "en": {
    // This is the title at the top of a pop-up. It refers to the version of ODK
    // Central that the user is using.
    "title": "Central Version",
    "shortVersion": "You are using ODK Central {version}.",
    "longVersion": "You can find more detailed version information below:"
  }
}
</i18n>
