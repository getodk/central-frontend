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
  <iframe v-if="enketoSrc" id="enketo-iframe" title="Enketo" :src="enketoSrc"></iframe>
</template>

<script setup>
import { computed, inject } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import useEventListener from '../composables/event-listener';
import { queryString } from '../util/request';

defineOptions({
  name: 'EnketoIframe'
});

const props = defineProps({
  enketoId: {
    type: String,
    required: true
  },
  actionType: {
    type: String,
    required: true
  },
  instanceId: String
});

const { location } = inject('container');

const route = useRoute();
const router = useRouter();

const redirectUrl = computed(() => route.query.return_url);

const enketoSrc = computed(() => {
  let prefix = '/enketo-passthrough';
  const { return_url: _, ...query } = route.query;

  query.parentWindowOrigin = location.origin;

  // this is to avoid 404 warning
  if (process.env.NODE_ENV === 'test') {
    prefix = `/#${prefix}`;
  }

  if (props.actionType === 'offline') {
    prefix += '/x';
  } else if (props.actionType === 'public-link') {
    prefix += '/single';
  } else if (props.actionType === 'edit') {
    prefix += `/${props.actionType}`;
    query.instance_id = props.instanceId;
  } else if (props.actionType === 'preview') {
    prefix += `/${props.actionType}`;
  }
  // for actionType 'new', we don't need to add anything to the prefix.

  return `${prefix}/${props.enketoId}${queryString(query)}`;
});

function handleIframeMessage(event) {
  if (event.origin === location.origin) {
    const { parentWindowOrigin } = route.query;
    // For the cases where this page is embedded in external iframe, pass the event data to the
    // parent.
    if (location !== window.parent.location &&
        parentWindowOrigin &&
        typeof parentWindowOrigin === 'string') {
      window.parent.postMessage(event.data, parentWindowOrigin);
    }

    let eventData;
    try { eventData = JSON.parse(event.data); } catch {}

    if (eventData?.enketoEvent === 'submissionsuccess' && redirectUrl.value) {
      router.push((new URL(redirectUrl.value)).pathname);
    }
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
