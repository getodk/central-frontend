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
  <page-body v-if="loadingState">
    <loading :state="true"/>
  </page-body>
  <template v-if="form.dataExists">
    <web-form-renderer v-if="form.webformsEnabled || $route.query.webforms === 'true'"
      action-type="preview" @loaded="hideLoading"/>
    <enketo-iframe v-else :enketo-id="form.enketoId" action-type="preview" @loaded="hideLoading"/>
  </template>
</template>

<script setup>
import { defineAsyncComponent, ref, watch } from 'vue';
import { useRequestData } from '../../request-data';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
import Loading from '../loading.vue';
import { loadAsync } from '../../util/load-async';

import PageBody from '../page/body.vue';

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

const loadingState = ref(true);
const hideLoading = () => {
  loadingState.value = false;
};

const { form } = useRequestData();


const WebFormRenderer = defineAsyncComponent(loadAsync('WebFormRenderer'));
const EnketoIframe = defineAsyncComponent(loadAsync('EnketoIframe'));

const fetchForm = () => {
  form.request({
    url: props.draft ? apiPaths.formDraft(props.projectId, props.xmlFormId) : apiPaths.form(props.projectId, props.xmlFormId),
    extended: true
  }).catch(noop);
};

if (!form.dataExists) fetchForm();

watch(() => form.initiallyLoading, (value) => {
  if (!value) loadingState.value = form.dataExists;
});
</script>

<style lang="scss">
:root {
  font-size: 16px;
}
html, body {
  box-shadow: none;
}
</style>
