<!--
Copyright 2022 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div v-if="backupsConfig.isDefined()" id="backup-deprecation">
    <p>
      <span>{{ $t('text') }}</span>
      <sentence-separator/>
      <i18n-t keypath="moreInfo.clickHere.full">
        <template #clickHere>
          <a href="https://forum.getodk.org/t/backups-to-google-drive-from-central-will-stop-working-after-oct-3/38895" target="_blank">{{ $t('moreInfo.clickHere.clickHere') }}</a>
        </template>
      </i18n-t>
    </p>
  </div>
</template>

<script>
import SentenceSeparator from '../sentence-separator.vue';

import { requestData } from '../../store/modules/request';

export default {
  name: 'BackupsDeprecation',
  components: { SentenceSeparator },
  // The component assumes that this data will exist when the component is
  // created.
  computed: requestData(['backupsConfig'])
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#backup-deprecation {
  background-color: $color-warning-light;
  margin-bottom: 20px;
  padding: 15px;

  p {
    margin-bottom: 0;
    // Provide a little more width so that the text fits on one line in English.
    &:lang(en) { max-width: 82ch; }
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    "text": "On January 31st, 2023, backups to Google Drive will stop working."
  }
}
</i18n>
