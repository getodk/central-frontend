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
  <div id="submission-download-dropdown" class="btn-group">
    <button id="submission-download-dropdown-toggle" type="button"
      class="btn btn-primary dropdown-toggle" data-toggle="dropdown"
      aria-haspopup="true" aria-expanded="false">
      <span class="icon-arrow-circle-down"></span>
      <span>{{ buttonText }}</span>
      <span class="caret"></span>
    </button>
    <ul class="dropdown-menu"
      aria-labelledby="submission-download-dropdown-toggle" @click="download">
      <li>
        <a :href="`${baseUrl}/submissions.csv.zip`" :target="target">
          {{ $t('action.download.withMedia') }}
        </a>
      </li>
      <li :class="{ disabled: disablesDownloadWithoutMedia }">
        <a :href="`${baseUrl}/submissions.csv.zip?media=false`"
          :target="target">
          {{ $t('action.download.withoutMedia') }}
        </a>
      </li>
      <li>
        <a :href="`${baseUrl}/submissions.csv`" :target="target">
          {{ $t('action.download.primaryDataTable') }}
        </a>
      </li>
    </ul>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

import Form from '../../presenters/form';
import { requestData } from '../../store/modules/request';

export default {
  name: 'SubmissionDownloadDropdown',
  props: {
    baseUrl: {
      type: String,
      required: true
    },
    formVersion: {
      type: Form,
      required: true
    }
  },
  computed: {
    ...requestData(['fields']),
    ...mapGetters(['managedKey']),
    buttonText() {
      if (this.formVersion.submissions <= 1)
        return this.$t('action.download.allRecords.withoutCount');
      return this.$tcn(
        'action.download.allRecords.withCount',
        this.formVersion.submissions
      );
    },
    target() {
      return this.managedKey == null ? '_blank' : null;
    },
    disablesDownloadWithoutMedia() {
      // The link will be enabled while this.fields is loading.
      return this.fields != null && !this.fields.some(field => field.binary);
    }
  },
  methods: {
    download(event) {
      const { target } = event;
      if (target.tagName !== 'A') return;
      const disabled = target.parentNode.classList.contains('disabled');
      if (this.managedKey == null) {
        if (disabled) event.preventDefault();
      } else {
        event.preventDefault();
        if (!disabled) this.$emit('decrypt', target.getAttribute('href'));
      }
    }
  }
};
</script>

<i18n lang="json5">
{
  "en": {
    "action": {
      "download": {
        "allRecords": {
          "withCount": "Download all {count} record | Download all {count} records",
          "withoutCount": "Download all records"
        },
        "withMedia": "All data and media files (.zip)",
        "withoutMedia": "All data without media files (.zip)",
        "primaryDataTable": "Primary data table (.csv)"
      }
    }
  }
}
</i18n>
