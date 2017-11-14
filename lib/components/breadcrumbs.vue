<!--
Copyright 2017 Super Adventure Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/nafundi/super-adventure/blob/master/NOTICE.

This file is part of Super Adventure. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of Super Adventure,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
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
