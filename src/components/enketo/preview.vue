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
  <a v-if="disabledTitle == null" class="enketo-preview btn btn-primary"
    :href="href" target="_blank">
    <span class="icon-eye"></span>{{ $t('action.preview') }}
  </a>
  <button v-else type="button" class="enketo-preview btn btn-primary" disabled
    :title="disabledTitle">
    <span class="icon-eye"></span>{{ $t('action.preview') }}
  </button>
</template>

<script>
import Form from '../../presenters/form';

export default {
  name: 'EnketoPreview',
  props: {
    formVersion: {
      type: Form,
      required: true
    }
  },
  computed: {
    disabledTitle() {
      if (this.formVersion.publishedAt != null &&
        this.formVersion.state !== 'open')
        return this.$t('disabled.notOpen');
      if (this.formVersion.enketoId == null)
        return this.$t('disabled.processing');
      return null;
    },
    href() {
      // enketoId probably doesn't need to be encoded, but there is also little
      // harm.
      return `/enketo/preview/${encodeURIComponent(this.formVersion.enketoId)}`;
    }
  }
};
</script>

<i18n lang="json5">
{
  "en": {
    "action": {
      "preview": "Preview"
    },
    "disabled": {
      "processing": "Preview has not finished processing for this Form. Please refresh later and try again.",
      "notOpen": "In this version of ODK Central, preview is only available for Forms in the Open state."
    }
  }
}
</i18n>
