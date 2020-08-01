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
  <modal id="project-form-access-states" :state="state" hideable backdrop
    @hide="$emit('hide')">
    <template #title>{{ $t('title') }}</template>
    <template #body>
      <div class="modal-introduction">
        <p>{{ $t('introduction[0]') }}</p>
        <i18n tag="p" path="introduction[1].full">
          <template #open>
            <strong>{{ $t('introduction[1].open') }}</strong>
          </template>
        </i18n>
        <i18n tag="p" path="introduction[2].full">
          <template #closing>
            <strong>{{ $t('introduction[2].closing') }}</strong>
          </template>
          <template #not>
            <em>{{ $t('introduction[2].not') }}</em>
          </template>
        </i18n>
        <i18n tag="p" path="introduction[3].full">
          <template #closed>
            <strong>{{ $t('introduction[3].closed') }}</strong>
          </template>
          <template #not1>
            <em>{{ $t('introduction[3].not1') }}</em>
          </template>
          <template #not2>
            <em>{{ $t('introduction[3].not2') }}</em>
          </template>
        </i18n>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-primary" @click="$emit('hide')">
          {{ $t('action.ok') }}
        </button>
      </div>
    </template>
  </modal>
</template>

<script>
import Modal from '../../modal.vue';

export default {
  name: 'ProjectFormAccessStates',
  components: { Modal },
  props: {
    state: {
      type: Boolean,
      default: false
    }
  }
};
</script>

<style lang="scss">
#project-form-access-states {
  .modal-introduction p:first-child {
    margin-bottom: 20px;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    // This is the title at the top of a pop-up.
    "title": "Form States",
    "introduction": [
      "Form States control the lifecycle state of each Form. Usually, but not always, a Form will start Open and proceed through Closing to Closed when it is no longer needed.",
      {
        "full": "{open} Forms are available to download on mobile devices, and will accept new Submissions.",
        "open": "Open"
      },
      {
        "full": "{closing} Forms will accept new Submissions, but are {not} available to download on mobile devices.",
        "closing": "Closing",
        "not": "not"
      },
      {
        "full": "{closed} Forms are {not1} available to download on mobile devices, and will {not2} accept new Submissions.",
        "closed": "Closed",
        "not1": "not",
        "not2": "not"
      }
    ]
  }
}
</i18n>
