<!--
Copyright 2023 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <span>
    <div class="form-group">
      <span class="icon-filter"></span><span>{{ $t('common.filter') }}</span>
    </div>
    <entity-filters-conflict :model-value="conflict"
      @update:model-value="$emit('update:conflict', $event)"/>
  </span>
</template>

<script setup>
import EntityFiltersConflict from './filters/conflict.vue';

defineOptions({
  name: 'EntityFilters'
});
defineProps({
  conflict: {
    type: Array,
    required: true
  }
});
defineEmits(['update:conflict']);
</script>
