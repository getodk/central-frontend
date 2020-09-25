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

<!-- A SummaryItem component that shows the version string of a form version -->
<template>
  <summary-item icon="file-o" class="form-version-summary-item">
    <template #heading>
      <div class="version" :class="{ 'blank-version': version.version === '' }">
        <span :title="version.versionOrBlank()">
          {{ version.versionOrBlank() }}
        </span>
      </div>
    </template>
    <template #body>
      <slot name="body"></slot>
    </template>
  </summary-item>
</template>

<script>
import Form from '../../presenters/form';
import SummaryItem from '../summary-item.vue';

export default {
  name: 'FormVersionSummaryItem',
  components: { SummaryItem },
  props: {
    version: {
      type: Form,
      required: true
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

.form-version-summary-item .summary-item-heading {
  .version {
    font-family: $font-family-monospace;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .blank-version { font-family: inherit; }
}
</style>
