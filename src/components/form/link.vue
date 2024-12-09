<!--
Copyright 2024 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->

<!-- Specifying :key so that if the link path changes, the element will be
replaced. If a hover card is shown next to the element, it will be hidden. -->
<template>
  <link-if-can v-if="to == null" ref="link" :key="toDefault" :to="toDefault">
    {{ form.name ?? form.xmlFormId }}
  </link-if-can>
  <router-link v-else ref="link" :key="to" :to="to">
    {{ form.name ?? form.xmlFormId }}
  </router-link>
</template>

<script setup>
import { computed, ref } from 'vue';

import LinkIfCan from '../link-if-can.vue';

import useHoverCard from '../../composables/hover-card';
import useRoutes from '../../composables/routes';

defineOptions({
  name: 'FormLink'
});
const props = defineProps({
  // This may be a transformed form resource, but it is not required to be. For
  // example, props.form.nameOrId may or may not be defined.
  form: {
    type: Object,
    required: true
  },
  to: String
});

const { primaryFormPath } = useRoutes();
const toDefault = computed(() => primaryFormPath(props.form));

const link = ref(null);
useHoverCard(computed(() => link.value?.$el), 'form', () => props.form);
</script>
