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
  <div>
    <span>{{ $tc('message', duplicateProperties.length) }}</span>
    <ul>
      <li v-for="p of duplicateProperties" :key="p.provided">
        {{ $t('duplicateProperty', p) }}
      </li>
    </ul>
  </div>
</template>

<script setup>
defineOptions({
  name: 'Alert40917'
});
defineProps({
  duplicateProperties: {
    type: Array,
    required: true
  }
});
</script>

<i18n lang="json5">
{
  // @transifexKey util.request.problem.409_17
  "en": {
    "message": "This Form attempts to create a new Entity property that matches with an existing one except for capitalization: | This Form attempts to create new Entity properties that match with existing ones except for capitalization:",
    // Error message format for the duplicate properties (different capitalization) in an Entity-list.
    // {provided} is the property name in the uploaded Form.
    // {current} is the existing property name in the Entity-list.
    "duplicateProperty": "{provided} (existing: {current})"
  }
}
</i18n>
