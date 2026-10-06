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
  <div v-if="link != null" class="infonav-button">
    <router-link class="btn btn-link" :to="link">
      <slot name="title"></slot>
      <span v-if="count != null" class="infonav-badge">{{ count }}</span>
    </router-link>
  </div>
  <dropdown v-else class="infonav-button" placement="bottom-start">
    <template #toggle="{ toggle, attrs }">
      <button type="button" class="btn dropdown-toggle" v-bind="attrs"
        @click="toggle">
          <slot name="title"></slot>
          <span v-if="count != null" class="infonav-badge">{{ count }}</span>
          <span class="icon-angle-down"></span>
      </button>
    </template>
    <template #menu>
      <slot name="dropdown"></slot>
    </template>
  </dropdown>
</template>

<script setup>
import Dropdown from './dropdown.vue';

defineOptions({
  name: 'Infonav'
});
defineProps({
  // If a link is provided, the button will navigate to that link when clicked instead of dropping down.
  link: String,
  // If a count is provided, a badge will be displayed with the count.
  count: Number
});
</script>

<style lang="scss">
@import '../assets/scss/variables';

  .infonav-button {
    margin-left: 10px;
    color: $color-text;

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      background-color: rgba($color-action-light, 0.5);
      border-radius: 20px;
      border: none;
      box-shadow: none;
      color: $color-text;

      &:hover, &:focus {
        background-color: $color-action-light;
        color: $color-text;
        text-decoration: none;
        background-clip: unset;

        .infonav-badge {
          background-color: rgba($color-action-background, 0.3);
        }
      }
    }

    &.open > .btn {
      background-color: $color-action-background;
      color: #fff;

      .infonav-badge {
        background-color: rgba(#fff, 0.3);
        color: #fff;
      }
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

  .infonav-badge {
    min-width: 22px;
    line-height: 16px;
    padding: 4px 8px;
    background-color: $color-action-light;
    border-radius: 100px;
  }

  .dropdown-divider {
    margin-top: 0px;
    margin-bottom: 0px;
  }
</style>
