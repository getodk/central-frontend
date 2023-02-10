<!--
Copyright 2023 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <tr>
    <td v-for="property of properties" :key="property.id">
      {{ entity[property.name] }}
    </td>
    <td>{{ entity.label }}</td>
    <td>{{ entity.name }}</td>
  </tr>
</template>

<script>
export default {
  name: 'EntityDataRow',
  props: {
    entity: {
      type: Object,
      required: true
    },
    properties: {
      type: Array,
      required: true
    }
  },
  computed: {
  },
  methods: {
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#entity-table-data {
  .int-field, .decimal-field { text-align: right; }
  .geopoint-field { max-width: 500px; }

  .binary-field { text-align: center; }
  .binary-link {
    background-color: $color-subpanel-background;
    border-radius: 99px;
    padding: 4px 7px;
    text-decoration: none;

    .icon-check {
      color: $color-success;
      margin-right: 0;
    }

    .icon-download {
      border-left: 1px dotted #ccc;
      color: #bbb;
      padding-left: 5px;
    }
    &:hover .icon-download { color: $color-action-foreground; }
  }

  .encrypted-entity {
    $icon-lock-margin-left: 3px;
    $icon-lock-margin-right: 12px;
    .icon-lock {
      font-size: 16px;
      color: #666;
      margin-left: $icon-lock-margin-left;
      margin-right: $icon-lock-margin-right;
      vertical-align: -2px;
    }

    .encryption-message { font-style: italic; }

    ~ .encrypted-entity {
      .encrypted-data { position: relative; }
      .encryption-message { display: none; }

      .encryption-overlay {
        background-color: #ddd;
        display: inline-block;
        height: 12px;
        position: absolute;
        // Adding 4px in order to vertically center the overlay.
        top: $padding-top-table-data + 4px;
        // 12px is the width of the .icon-lock (plus a pixel or two for good
        // measure).
        width: calc(100% - #{$padding-left-table-data + $icon-lock-margin-left} -
          12px - #{$icon-lock-margin-right + $padding-right-table-data});
      }
    }
  }
}
</style>
