<template>
  <ol v-show="breadcrumbs.length > 1" class="breadcrumb">
    <li v-for="(breadcrumb, index) in breadcrumbs"
      :class="{ active: index === breadcrumb.length - 1 }">
      <template v-if="linkBreadcrumb(index)">
        <a href="#" @click.prevent="view(breadcrumb)">{{ breadcrumb.title }}</a>
      </template>
      <template v-else>{{ breadcrumb.title }}</template>
    </li>
  </ol>
</template>

<script>
import Dashboard from './dashboard.vue';

export default {
  props: ['breadcrumbs'],
  methods: {
    linkBreadcrumb(index) {
      const breadcrumb = this.breadcrumbs[index];
      return breadcrumb.view != null && index != this.breadcrumbs.length - 1;
    },
    view(breadcrumb) {
      let props = breadcrumb.props;
      if (breadcrumb.view != null && breadcrumb.props == null) props = {};
      this.$emit('view', breadcrumb.view, props);
    }
  }
};
</script>
