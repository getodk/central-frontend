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
  <iframe id="enketo-iframe" ref="enketoIframe" title="Enketo" :src="enketoSrc" @load="redirect"></iframe>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

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

const redirectUrl = computed(() => route.query.return_url);

const enketoSrc = computed(() => {
  const prefix = '/enketo-passthrough';
  const { return_url: _, ...query } = route.query;

  const queryParams = new URLSearchParams({ ...query, parentWindowOrigin: window.location.origin });
  let enketoPath;
  switch (props.actionType) {
    case 'preview':
      enketoPath = `/preview/${props.enketoId}`;
      break;
    case 'edit': {
      enketoPath = `/edit/${props.enketoId}`;
      break;
    }
    case 'offline': {
      enketoPath = `/x/${props.enketoId}`;
      break;
    }
    case 'single': {
      enketoPath = `/single/${props.enketoId}`;
      break;
    }
    case '': {
      enketoPath = `/${props.enketoId}`;
      break;
    }
    default:
      throw new Error(`Unrecognized Enketo action type: "${props.actionType}"`);
  }
  return `${prefix}${enketoPath}?${queryParams.toString()}`;
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
window.addEventListener('message', handleIframeMessage, false);
</script>

<style lang="scss">
#enketo-iframe {
  display: block;
  border: none;
  height: 100vh;
  width: 100%;
}
</style>
