<template>
  <table v-if="render" v-show="visible" id="column-grow" class="table">
    <thead>
      <th ref="th"></th>
      <th></th>
      <th></th>
    </thead>
    <tbody>
      <td><div :style="{ width: px(contentWidth) }"></div></td>
      <td></td>
      <td></td>
    </tbody>
  </table>
</template>

<script setup>
import { ref } from 'vue';

import useColumnGrow from '../../../src/composables/column-grow';

import { px } from '../../../src/util/dom';

const props = defineProps({
  contentWidth: {
    type: Number,
    required: true
  },
  grow: {
    type: Number,
    required: true
  },
  render: {
    type: Boolean,
    default: true
  },
  visible: {
    type: Boolean,
    default: true
  }
});

const th = ref(null);
const { resize } = useColumnGrow(th, props.grow);
defineExpose({ resize });
</script>

<style lang="scss">
#column-grow {
  table-layout: fixed;
  width: 100px;

  th:nth-child(1), th:nth-child(2) { width: 20px; }

  td div {
    height: 1px;
    overflow: hidden;
  }
  th, td { padding: 0; }
}
</style>
