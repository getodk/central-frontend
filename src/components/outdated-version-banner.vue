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
  <div v-if="showBanner" class="outdated-version-banner">
    <iframe :src="iframeSrc" :title="$t('title')"></iframe>

    <a class="btn btn-primary"
      href="https://docs.getodk.org/central-upgrade/"
      target="_blank" rel="noopener"
      v-tooltip.aria-describedby="$t('instructionsToUpgradeTooltip')">
        {{ $t('instructionsToUpgrade') }}
    </a>

    <button class="btn btn-danger"
      type="button"
      v-tooltip.aria-describedby="$t('dismissTooltip')"
      @click="dismiss">
        {{ $t('dismiss') }}
    </button>
  </div>
</template>

<script setup>
import { computed, inject } from 'vue';
import { useRequestData } from '../request-data';
import { useSessions } from '../util/session';

const { visiblyLoggedIn } = useSessions();

const { centralVersion, currentUser } = useRequestData();

defineOptions({
  name: 'OutdatedVersionBanner'
});

const container = inject('container');
const { i18n: globalI18n } = container;
const languageSubtag = computed(() => new Intl.Locale(globalI18n.locale).language);

const iframeSrc = computed(() => `https://sadiqkhoja.com/central/outdated-version.html?version=${centralVersion.data?.currentVersion}&lang=${languageSubtag.value}`);

const showBanner = computed(() => {
  // user is not logged in or doesn't have ability to set config (implying not an admin)
  if (!currentUser.dataExists || !visiblyLoggedIn || !currentUser.can('config.set')) return false;
  if (!centralVersion.dataExists) return false;

  // User has seen the warning in the last 30 days, so don't show it again
  // 864E5 is the number of milliseconds in a day
  const dismissDate = currentUser.preferences?.site?.outdatedVersionWarningDismissDate;
  if (dismissDate && centralVersion.currentDate.getTime() < (dismissDate.getTime() + (864E5 * 30))) return false;

  // Difference between current year and Central version year is less than 2
  const centralVersionYear = Number(centralVersion.currentVersion.match(/^(\d{4})/)[1]);
  const currentYear = centralVersion.currentDate.getFullYear();
  if (currentYear - centralVersionYear < 2) return false;

  return true;
});

const dismiss = () => {
  currentUser.preferences.site.outdatedVersionWarningDismissDate = centralVersion.currentDate;
};
</script>

<style lang="scss">
@import '../assets/scss/variables';

.outdated-version-banner {
  background-color: $color-danger-light;
  border: 1px solid $color-danger;
  border-radius: 8px;
  padding: 0 20px 20px 20px;
  text-align: center;
  width: 700px;
  margin: 20px auto;
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.2);

  iframe {
    border-width: 0;
    height: 250px;
    width: 600px;
    margin: 0 auto;
  }

  .btn {
    margin: 0 5px;
    min-width: 100px;
  }
}

</style>

<i18n lang="json5">
  {
    "en": {
      // This is a title for the outdated version banner shown for the screenreaders only
      "title": "Outdate Version",
      "instructionsToUpgrade": "Instructions to upgrade",
      "instructionsToUpgradeTooltip": "Click here to see the instructions to upgrade the Central",
      "dismiss": "Dismiss for 30 days",
      "dismissTooltip": "Click here to dismiss this warning for 30 days."
    }
  }
  </i18n>
