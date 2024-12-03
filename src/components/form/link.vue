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
<template>
  <link-if-can ref="link" :key="to" :to="to">
    {{ form.name ?? form.xmlFormId }}
  </link-if-can>
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
  // This should have all the properties of a form response from the REST API,
  // but it is not necessarily a transformed form resource. For example,
  // props.form.nameOrId may or may not be defined.
  form: {
    type: Object,
    required: true
  }
});

const { primaryFormPath } = useRoutes();
const to = computed(() => primaryFormPath(props.form));

const link = ref(null);
useHoverCard(computed(() => link.value?.el), 'form', () => props.form);
</script>
