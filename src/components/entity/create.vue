<template>
  <entity-upsert-modal id="entity-create" v-bind="props" create
    @hide="emit('hide')" @success="emit('success', $event)"/>
</template>

<script setup>
import EntityUpsertModal from './upsert.vue';

defineOptions({
  name: 'EntityCreate'
});
const props = defineProps({
  state: Boolean
});
const emit = defineEmits(['hide', 'success']);
</script>
