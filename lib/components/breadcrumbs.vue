<template>
  <ol v-show="breadcrumbs.length > 0" class="breadcrumb">
    <li v-for="(breadcrumb, index) in breadcrumbs"
      :class="{ active: index === breadcrumbs.length - 1 }">
      <template v-if="linkBreadcrumb(index)">
        <a href="#" @click.prevent="view(breadcrumb)">{{ breadcrumb.title }}</a>
      </template>
      <template v-else>{{ breadcrumb.title }}</template>
    </li>
  </ol>
</template>

<script>
export default {
  props: {
    breadcrumbs: {
      type: Array,
      required: true
    }
  },
  methods: {
    linkBreadcrumb(index) {
      const breadcrumb = this.breadcrumbs[index];
      return breadcrumb.view != null && index != this.breadcrumbs.length - 1;
    },
    view(breadcrumb) {
      this.$emit('view', breadcrumb.view, breadcrumb.props);
    }
  }
};
</script>
