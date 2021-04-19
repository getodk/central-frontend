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
  <page-section id="submission-basic-details" condensed>
    <template #heading><span>{{ $t('common.basicInfo') }}</span></template>
    <template #body>
      <dl>
        <div>
          <dt>{{ $t('header.instanceId') }}</dt>
          <dd><span :title="submission.__id">{{ submission.__id }}</span></dd>
        </div>
        <div>
          <dt>{{ $t('header.submitterName') }}</dt>
          <dd>
            <span :title="submission.__system.submitterName">{{ submission.__system.submitterName }}</span>
          </dd>
        </div>
        <div>
          <dt>{{ $t('header.submissionDate') }}</dt>
          <dd><date-time :iso="submission.__system.submissionDate"/></dd>
        </div>
        <div v-if="submission.__system.deviceId != null">
          <dt>{{ $t('deviceId') }}</dt>
          <dd>
            <span :title="submission.__system.deviceId">{{ submission.__system.deviceId }}</span>
          </dd>
        </div>
        <div v-if="submission.__system.attachmentsExpected !== 0">
          <dt>{{ $t('attachments') }}</dt>
          <dd>
            <span>{{ attachments }}</span>
            <template v-if="missingMedia">
              <span class="icon-exclamation-triangle"></span>
              <span>{{ $t('submission.missingMedia') }}</span>
            </template>
          </dd>
        </div>
      </dl>
    </template>
  </page-section>
</template>

<script>
import DateTime from '../date-time.vue';
import PageSection from '../page/section.vue';

import { requestData } from '../../store/modules/request';

export default {
  name: 'SubmissionBasicDetails',
  components: { DateTime, PageSection },
  computed: {
    // The component assumes that this data will exist when the component is
    // created.
    ...requestData(['submission']),
    attachments() {
      const { attachmentsPresent, attachmentsExpected } = this.submission.__system;
      return this.$t('attachmentSummary', {
        present: this.$tcn('present', attachmentsPresent),
        expected: this.$tcn('expected', attachmentsExpected)
      });
    },
    missingMedia() {
      const { attachmentsPresent, attachmentsExpected } = this.submission.__system;
      return attachmentsPresent !== attachmentsExpected;
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/mixins';

#submission-basic-details {
  margin-bottom: $margin-bottom-page-section;

  dd { @include text-overflow-ellipsis; }

  .icon-exclamation-triangle {
    color: $color-warning;
    margin-left: 12px;
    margin-right: $margin-right-icon;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    "deviceId": "Device ID",
    "attachments": "Media files",
    "present": "{count} file | {count} files",
    // This shows the number of files that were expected to be submitted.
    "expected": "{count} expected | {count} expected",
    // {present} shows the number of files that were submitted, and {expected}
    // shows the number of files that were expected to be submitted. For
    // example: "2 files / 3 expected"
    "attachmentSummary": "{present} / {expected}"
  }
}
</i18n>
