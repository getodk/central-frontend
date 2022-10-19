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

<!-- Standard form definition buttons -->
<template>
  <span class="form-version-standard-buttons">
    <enketo-preview :form-version="version"/>
    <form-version-def-dropdown :version="version"
      @view-xml="$emit('view-xml')"/>
  </span>
</template>

<script>
import EnketoPreview from '../enketo/preview.vue';
import FormVersionDefDropdown from './def-dropdown.vue';

export default {
  name: 'FormVersionStandardButtons',
  components: { EnketoPreview, FormVersionDefDropdown },
  props: {
    version: {
      type: Object,
      required: true
    }
  },
  emits: ['view-xml']
};
</script>

<style lang="scss">
.form-version-standard-buttons .enketo-preview {
  margin-right: 5px;
}
</style>
