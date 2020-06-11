<template>
  <component :is="component" v-bind="props"/>
</template>

<script>
export default {
  props: {
    component: {
      type: Object,
      required: true
    },
    props: {
      type: Object,
      default: () => ({})
    }
  }
};
</script>
