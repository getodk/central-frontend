<template>
  <component :is="component" v-bind="props">
    <template v-for="(_, name) in $slots" v-slot:[name]>
      <slot :name="name"></slot>
    </template>
  </component>
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
