<template>
  <selectable>{{ text }}</selectable>
</template>

<script>
import Selectable from '../../../src/components/selectable.vue';

export default {
  name: 'TestUtilSelectable',
  components: { Selectable },
  props: {
    text: {
      type: String,
      required: true
    }
  }
};
</script>
