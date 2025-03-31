<!--
Copyright 2025 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <form-edit-section id="form-edit-published-version" icon="star">
    <template #title>{{ $t('title') }}</template>
    <template #subtitle>
      <i18n-t keypath="subtitle.published">
        <template #dateTime>
          <date-time :iso="form.publishedAt"/>
        </template>
      </i18n-t>
    </template>
    <template #body>
      <div id="form-edit-published-version-string">
        <form-version-string :version="form.version"/>
      </div>
    </template>
  </form-edit-section>
</template>

<script setup>
import DateTime from '../../date-time.vue';
import FormEditSection from './section.vue';
import FormVersionString from '../../form-version/string.vue';

import { useRequestData } from '../../../request-data';

defineOptions({
  name: 'FormEditPublishedVersion'
});

// The component assumes that this data will exist when the component is
// created.
const { form } = useRequestData();
</script>

<style lang="scss">
@import '../../../assets/scss/mixins';

#form-edit-published-version-string {
  @include text-overflow-ellipsis;
  font-size: 17px;
  font-weight: bold;
  line-height: 1.2;
}
</style>

<i18n lang="json5">
{
  "en": {
    // This refers to the current version of a Form.
    "title": "Current version",
    "subtitle": {
      // This shows the date and time at which the current version of the Form
      // was published, for example: "Published 2020/01/01 01:23". {dateTime}
      // may show a formatted date like "2020/01/01", or it may use a word like
      // "today", "yesterday", or "Sunday".
      "published": "Published {dateTime}"
    }
  }
}
</i18n>
