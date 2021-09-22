<!--
Copyright 2021 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <modal id="analytics-introduction" :state="state" hideable backdrop
    @hide="$emit('hide')">
    <template #title>{{ $t('title') }}</template>
    <template #body>
      <div class="modal-introduction">
        <p>{{ $t('analytics.alwaysImprove') }}</p>
        <i18n tag="p" path="analytics.needFeedback.full">
          <template #your>
            <strong>{{ $t('analytics.needFeedback.your') }}</strong>
          </template>
        </i18n>
        <i18n tag="p" path="introduction[0].full">
          <template #usageInformation>
            <router-link v-slot="{ href, navigate }" to="/system/analytics"
              custom>
              <a :href="href" @click="hideAndNavigate(navigate, $event)">{{ $t('introduction[0].usageInformation') }}</a>
            </router-link>
          </template>
        </i18n>
        <p>{{ $t('introduction[1]') }}</p>
      </div>
      <div class="modal-actions">
        <router-link v-slot="{ href, navigate }" to="/system/analytics" custom>
          <a class="btn btn-primary" :href="href"
            @click="hideAndNavigate(navigate, $event)">
            {{ $t('action.improveCentral') }}
          </a>
        </router-link>
        <button type="button" class="btn btn-link" @click="$emit('hide')">
          {{ $t('action.close') }}
        </button>
      </div>
    </template>
  </modal>
</template>

<script>
import Modal from '../modal.vue';

export default {
  name: 'AnalyticsIntroduction',
  components: { Modal },
  props: {
    state: Boolean
  },
  methods: {
    hideAndNavigate(navigate, event) {
      this.$emit('hide');
      navigate(event);
    }
  }
};
</script>

<i18n lang="json5">
{
  "en": {
    // This is the title at the top of a pop-up.
    "title": "Help Improve Central!",
    "introduction": [
      {
        "full": "In the {usageInformation} tab in System Settings, you can choose to share anonymized usage data or contact information with the Central team.",
        "usageInformation": "Usage Information"
      },
      "There, you can also choose to not see this message again."
    ],
    "action": {
      "improveCentral": "Improve Central"
    }
  }
}
</i18n>
