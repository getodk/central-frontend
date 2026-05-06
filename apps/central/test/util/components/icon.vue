<template>
  <span :class="`icon-${icon}`"></span>
</template>

<script>
export default {
  name: 'TestUtilIcon',
  props: {
    icon: {
      type: String,
      required: true
    }
  }
};
</script>
