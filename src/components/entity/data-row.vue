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
