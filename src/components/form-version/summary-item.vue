<!--
Copyright 2020 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/opendatakit/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <summary-item icon="file-o">
    <template #heading>
      <span :class="versionClass" :title="version.versionOrBlank()">
        {{ version.versionOrBlank() }}
      </span>
      <span><form-version-standard-buttons :version="version"/></span>
    </template>
    <template #body>
      <slot name="body"></slot>
    </template>
  </summary-item>
</template>

<script>
import Form from '../../presenters/form';
import FormVersionStandardButtons from './standard-buttons.vue';
import SummaryItem from '../summary-item.vue';

export default {
  name: 'FormVersionSummaryItem',
  components: { FormVersionStandardButtons, SummaryItem },
  props: {
    version: {
      type: Form,
      required: true
    }
  },
  computed: {
    versionClass() {
      const htmlClass = ['form-version-summary-item-version'];
      if (this.version.version === '')
        htmlClass.push('form-version-summary-item-blank-version');
      return htmlClass;
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

.form-version-summary-item-version {
  display: inline-block;
  font-family: $font-family-monospace;
  max-width: calc(100% - 102px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  + span {
    bottom: 10px;
    margin-left: 12px;
    position: relative;
  }
}

.form-version-summary-item-blank-version {
  font-family: inherit;

  + span {
    bottom: 5px;
  }
}
</style>
