<template>
  <p>
    <i18n-t v-if="updated !== 0" keypath="updated.full" :plural="updated">
      <template #rows>
        <strong>{{ $tcn('updated.rows', updated) }}</strong>
      </template>
    </i18n-t>
    <sentence-separator v-if="created !== 0 && updated !== 0"/>
    <i18n-t v-if="created !== 0" keypath="created.full" :plural="created">
      <template #rows>
        <strong>{{ $tcn('created.rows', created) }}</strong>
      </template>
    </i18n-t>
  </p>
</template>

<script setup>
import { computed } from 'vue';

import SentenceSeparator from '../../sentence-separator.vue';

defineOptions({
  name: 'EntityUploadRowCounts'
});
const props = defineProps({
  entities: {
    type: Array,
    required: true
  }
});

const counts = computed(() => {
  let created = 0;
  let updated = 0;
  for (const entity of props.entities) {
    if (entity.uuid == null)
      created += 1;
    else
      updated += 1;
  }
  return { created, updated };
});
const created = computed(() => counts.value?.created);
const updated = computed(() => counts.value?.updated);
</script>

<i18n lang="json5">
{
  "en": {
    "created": {
      "full": "{rows} will be created. | {rows} will be created.",
      "rows": "{count} row | {count} rows"
    },
    "updated": {
      "full": "{rows} will be updated. | {rows} will be updated.",
      "rows": "{count} row | {count} rows"
    }
  }
}
</i18n>
