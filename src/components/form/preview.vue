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
  <loading :state="form.initiallyLoading"/>
  <WebFormRenderer v-if="form.dataExists" action-type="preview"/>
</template>

<script setup>
import useForm from '../../request-data/form';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
import Loading from '../loading.vue';
import WebFormRenderer from '../web-form-renderer.vue';

defineOptions({
  name: 'FormPreview'
});

const props = defineProps({
  projectId: {
    type: String,
    required: true
  },
  xmlFormId: {
    type: String,
    required: true
  },
  draft: {
    type: Boolean,
    required: true
  }
});

const { form } = useForm();

const fetchForm = () => {
  form.request({
    url: apiPaths.form(props.projectId, props.xmlFormId),
    extended: true
  }).catch(noop);
};

fetchForm();
</script>

<style lang="scss">
:root {
  font-size: 16px;
}
html, body {
  background-color: var(--gray-200);
  box-shadow: none;
}
</style>
