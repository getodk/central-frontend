<!-- Component for a heading at the top of a list -->
<template>
  <div>
    <h1>{{ title }}</h1>
    <span><slot></slot></span>
  </div>
</template>

<script>
export default {
  name: 'ListHeading',
  props: {
    title: {
      type: String,
      required: true
    }
  }
};
</script>

<style scoped>
div {
  margin-bottom: 18px;
}

h1 {
  display: inline;
}

span {
  float: right;
}
</style>
