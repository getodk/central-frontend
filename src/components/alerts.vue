<!--
Copyright 2025 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->

<!-- Alerts shown at the bottom of the screen -->
<template>
  <div id="alerts">
    <Toast v-show="showsToast"/>
    <RedAlert v-show="showsRedAlert"/>
  </div>
</template>

<script setup>
import { inject, ref, watch } from 'vue';

import RedAlert from './red-alert.vue';
import Toast from './toast.vue';

const { toast, redAlert, openModal } = inject('container');

const showsToast = ref(false);
const showsRedAlert = ref(false);
watch(() => toast.messageId, () => {
  showsToast.value = toast.state;
  if (toast.state) showsRedAlert.value = false;
});
watch(() => redAlert.messageId, () => {
  // If a modal is shown, the red alert will be shown inside the modal (see the
  // Modal component). In that case, it shouldn't be shown in this component at
  // the bottom of the screen.
  showsRedAlert.value = redAlert.state && !openModal.state;
  // Showing a red alert at the bottom of the screen should hide a toast: we
  // never want to show both alerts at the bottom of the screen. However,
  // showing a red alert inside a modal should not hide a toast. In that case,
  // the two are not competing for space. Also, a modal is never expected to
  // show a toast: see the comments in the Modal component.
  if (showsRedAlert.value) showsToast.value = false;
});
</script>

<style lang="scss">
@import '../assets/scss/variables';
@import '../assets/scss/mixins';

#alerts {
  @include floating-container;

  .alert {
    margin-bottom: 0;
  }
}
</style>
