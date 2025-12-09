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
<!-- eslint-disable vuejs-accessibility/alt-text -->
<template>
  <modal id="whats-new-modal" :state="isVisible" backdrop :hideable="true" @hide="hideModal">
    <template #banner>
      <img
        srcset="../assets/images/whats-new/banner@1x.png, ../assets/images/whats-new/banner@2x.png 2x"
        src="../assets/images/whats-new/banner@1x.png">
    </template>
    <template #title>{{ $t('title') }}</template>
    <template #body>
      <p class="modal-introduction">
        {{ $t('body') }}
      </p>
      <div class="modal-actions">
        <div v-if="!initialOptIn" class="checkbox">
          <label><input v-model="mailingListOptIn" type="checkbox">{{ $t('analytics.mailingListOptIn') }}</label>
        </div>
        <button type="button" class="btn btn-primary"
          @click="hideModal">
          {{ $t('action.done') }}
        </button>
      </div>
    </template>
  </modal>
</template>

<script setup>
import { inject, ref, watch } from 'vue';

import Modal from './modal.vue';

import { useRequestData } from '../request-data';

defineOptions({
  name: 'WhatsNew'
});

const { openModal } = inject('container');
const { currentUser, projects } = useRequestData();

const isVisible = ref(false);
const initialOptIn = currentUser.preferences.site.mailingListOptIn;
const mailingListOptIn = ref(currentUser.preferences.site.mailingListOptIn !== false);

watch(() => projects.dataExists, () => {
  // When updating `canUpdateForm` in the future, consider the *verb* for the audience.
  // For 2025.4, we decided it could be shown to project viewers as well,
  // where the previous modal was only shown to admins and project managers.
  const canUpdateForm = currentUser.can('submission.list') ||
    projects.data.some(project => project.verbs.has('submission.list'));
  if (canUpdateForm && // Check that user is admin or is able to edit forms in at least one project
    !openModal.state && // Check that no other modal (e.g. new project) is open
    !currentUser.preferences.site.whatsNewDismissed2025_4) {
    isVisible.value = true;
  }
});

function hideModal() {
  currentUser.preferences.site.whatsNewDismissed2025_4 = true;

  // If user was not already opted in and preference changed, then save preference.
  if (!initialOptIn && mailingListOptIn.value !== initialOptIn) {
    currentUser.preferences.site.mailingListOptIn = mailingListOptIn.value;
  }
  isVisible.value = false;
}

</script>

<style lang="scss">
@import '../assets/scss/variables';

#whats-new-modal .modal-actions {
  display: flex;
  column-gap: 10px;
  align-items: center;

  .checkbox {
    flex: 1;
    margin-bottom: 0px;
    font-size: 12px;

    label {
      display: block;
      text-align: left;
    }

    input[type=checkbox] {
      margin-top: 2px;
    }
  }

  .btn {
    margin-left: auto;
  }
}
</style>

<i18n lang="json5">
  {
    "en": {
      // This is the title at the top of a pop-up.
      "title": "Maps ️🗺️, bulk deletion ️🗑️, and better system visibility 👀",
      "body": "Introducing a new map view for Submissions and Entities, faster data cleanup with bulk Entity deletion and cleaner system insight through visible user invitation statuses and “last updated” timestamps!"
    }
  }
</i18n>
