<template>
  <table>
    <tbody>
      <tr v-for="(_, index) of new Array(rowCount)" :key="index" ref="rows">
        <td>foo</td>
      </tr>
    </tbody>
  </table>
</template>

<script setup>
import { computed, ref } from 'vue';

import { useRowChanged } from '../../../src/composables/row-changed';

const props = defineProps({
  rowCount: {
    type: Number,
    required: true
  }
});

const rows = ref([]);
for (let i = 0; i < props.rowCount; i += 1)
  useRowChanged(computed(() => rows.value[i]));
</script>
