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
    <RouterLink class="btn btn-default btn-web-form" :to="formPath('preview')" target="_blank">
      <span class="icon-eye"></span>
      New Preview
    </RouterLink>
    <form-version-def-dropdown :version="version"
      @view-xml="$emit('view-xml')"/>
  </span>
</template>

<script>
import { ref } from 'vue';
import EnketoPreview from '../enketo/preview.vue';
import FormVersionDefDropdown from './def-dropdown.vue';
import useRoutes from '../../composables/routes';

export default {
  name: 'FormVersionStandardButtons',
  components: { EnketoPreview, FormVersionDefDropdown },
  props: {
    version: {
      type: Object,
      required: true
    }
  },
  emits: ['view-xml'],
  setup() {
    const { formPath } = useRoutes();
    return { formPath };
  }
};
</script>

<style lang="scss">
.form-version-standard-buttons {
  .enketo-preview {
    margin-right: 5px;
  }
  .btn-web-form {
    display: none;
  }
}

// `new-web-forms` class is added to the root of App component when the
// new web form feature is enabled.
.new-web-forms {
  .form-version-standard-buttons {
    .enketo-preview {
      display: none;
    }
    .btn-web-form {
      margin-right: 5px;
      display: inline-block;
    }
  }
}

</style>
