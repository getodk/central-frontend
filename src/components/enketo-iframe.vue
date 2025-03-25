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
  <not-found v-if="invalidProps"/>
  <iframe v-else id="enketo-iframe" title="Enketo" :src="enketoSrc"></iframe>
</template>

<script setup>
import { computed, watchEffect } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { setDocumentTitle } from '../util/reactivity';
import NotFound from './not-found.vue';
import useEventListener from '../composables/event-listener';

defineOptions({
  name: 'EnketoIframe'
});

const props = defineProps({
  enketoId: {
    type: String,
    required: false
  },
  actionType: {
    type: String,
    required: false
  }
});

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const invalidProps = computed(() => {
  const validActionTypes = ['offline', 'edit', 'single', 'preview', ''];
  if (!props.enketoId) return true;
  if (!validActionTypes.includes(props.actionType)) return true;
  return false;
});

const redirectUrl = computed(() => route.query.return_url);

const enketoSrc = computed(() => {
  let prefix = '/enketo-passthrough';
  const { return_url: _, ...query } = route.query;

  const queryParams = new URLSearchParams({ ...query, parentWindowOrigin: window.location.origin });
  if (props.actionType === 'offline') {
    prefix += '/x';
  } else if (props.actionType) {
    prefix += `/${props.actionType}`;
  }
  return `${prefix}/${props.enketoId}?${queryParams.toString()}`;
});

watchEffect(() => {
  if (invalidProps.value) {
    setDocumentTitle(() => [t('title.pageNotFound')]);
  }
});

function handleIframeMessage(event) {
  let eventData;
  try { eventData = JSON.parse(event.data); } catch {}

  if (event.origin === window.location.origin &&
    eventData?.enketoEvent === 'submissionsuccess' &&
    redirectUrl.value) {
    router.push((new URL(redirectUrl.value)).pathname);
  }
}
useEventListener(window, 'message', handleIframeMessage, false);
</script>

<style lang="scss">
#enketo-iframe {
  display: block;
  border: none;
  height: 100vh;
  width: 100%;
}
</style>
