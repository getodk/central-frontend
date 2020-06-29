<template>
  <component :is="component" v-model="v" v-bind="props"/>
</template>

<script>
export default {
  name: 'TestUtilVModel',
  props: {
    component: {
      type: Object,
      required: true
    },
    props: {
      type: Object,
      default: () => ({})
    },
    value: null // eslint-disable-line vue/require-default-prop
  },
  data() {
    return {
      v: this.value
    };
  }
};
</script>
