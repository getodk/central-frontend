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
  <ol v-show="list.length > 0" class="breadcrumb">
    <li v-for="(breadcrumb, index) in list"
      :class="{ active: index === list.length - 1 }">
      <template v-if="linkBreadcrumb(index)">
        <router-link :to="breadcrumb.to">{{ breadcrumb.title }}</router-link>
      </template>
      <template v-else>{{ breadcrumb.title }}</template>
    </li>
  </ol>
</template>

<script>
export default {
  name: 'Breadcrumbs',
  props: {
    list: {
      type: Array,
      required: true
    }
  },
  methods: {
    linkBreadcrumb(index) {
      return this.list[index].to != null && index !== this.list.length - 1;
    }
  }
};
</script>
