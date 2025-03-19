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
    <router-link v-if="link != null" class="btn btn-link" :to="link">
      <slot name="title"></slot>
    </router-link>
    <template v-else>
      <button :id="toggleId" type="button" class="btn dropdown-toggle" data-toggle="dropdown"
        aria-haspopup="menu" aria-expanded="false">
          <slot name="title"></slot>
          <span class="icon-angle-down"></span>
      </button>
      <ul class="dropdown-menu" :aria-labelledby="toggleId">
        <slot name="dropdown"></slot>
      </ul>
    </template>
  </div>
</template>


<script>
let id = 1;
</script>
<script setup>
defineOptions({
  name: 'Infonav'
});
defineProps({
  // If a link is provided, the button will navigate to that link when clicked instead of dropping down.
  link: String
});

const idPrefix = `infonav${id}`;
id += 1;
const toggleId = `${idPrefix}-toggle`;

</script>

<style lang="scss">
@import '../assets/scss/variables';

  #page-head:not(:hover):not(:focus-within) .infonav-button {
    color: #999;
    a {
      color: #999;
      [class^="icon-"] {
        color: #aaa;
      }
    }
  }

  .infonav-button {
    margin-left: 10px;
    color: $color-action-foreground;

    .btn {
      font-size: 15px;
      box-shadow: none;

      &:hover {
        background-color: #fff;
        color: $color-action-foreground;
      }

    }
    button:focus {
        background-color: $color-action-background;
        color: #fff;
      }

    .icon-angle-down {
      margin-left: 5px;
    }

    .dropdown-menu {
      font-size: 15px;
      border: none;
      border-radius: 2px;
      margin-top: 0px;
      min-width: 100%;

      li a {
        max-width: 300px;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }


  .dropdown-divider {
    margin-top: 0px;
    margin-bottom: 0px;
  }
</style>
