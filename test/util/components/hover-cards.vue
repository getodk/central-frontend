<template>
  <div>
    <div id="anchor-container">
      <component :is="anchorComponent" v-bind="anchorProps"/>
    </div>
    <hover-cards/>
  </div>
</template>

<script setup>
import HoverCards from '../../../src/components/hover-cards.vue';

defineOptions({
  name: 'TestUtilHoverCards'
});
defineProps({
  anchorComponent: {
    type: Object,
    required: true
  },
  anchorProps: {
    type: Object,
    default: () => ({})
  }
});
</script>
