<!--
Copyright 2025 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div class="infonav-button dropdown">
    <div v-if="!$slots.dropdown && link == null">
      <slot name="title"></slot>
    </div>
    <router-link v-else-if="link != null" :to="link">
      <slot name="title"></slot>
    </router-link>
    <button v-else :id="toggleId" type="button" class="btn-link dropdown-toggle" data-toggle="dropdown"
      aria-haspopup="menu" aria-expanded="false">
      <a href="#">
        <slot name="title"></slot>
        <span class="icon-angle-down"></span>
      </a>
    </button>
    <ul class="dropdown-menu" :aria-labelledby="toggleId">
      <slot name="dropdown"></slot>
    </ul>
  </div>
</template>


<script>
let id = 1;
</script>
<script setup>

defineProps({
  // If a link is provided, the button will navigate to that link when clicked instead of dropping down.
  link: String
});

const idPrefix = `infonav${id}`;
id += 1;
const toggleId = `${idPrefix}-toggle`;

</script>

<style lang="scss">
  .infonav-button {
    margin-left: 10px;
    font-size: 15px;
    white-space: nowrap;

    .icon-angle-down {
      margin-left: 5px;
    }
  }

  .dropdown-menu {
    font-size: 15px;
  }

  .dropdown-divider {
    margin-top: 0px;
    margin-bottom: 0px;
  }
</style>
