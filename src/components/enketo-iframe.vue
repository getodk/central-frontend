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
import { computed, inject, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useRequestData } from '../request-data';

import useEventListener from '../composables/event-listener';
import { getCookieValue } from '../util/util';

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

const emit = defineEmits(['loaded']);

const { location, buildMode } = inject('container');

const { form } = useRequestData();
const route = useRoute();
const router = useRouter();

const redirectUrl = computed(() => {
  const { return_url: returnUrlPascalCase, returnUrl } = route.query;
  if (returnUrlPascalCase && typeof returnUrlPascalCase === 'string') return returnUrlPascalCase;
  if (returnUrl && typeof returnUrl === 'string') return returnUrl;
  return null;
});

const lastSubmitted = (enketoOnceId) => {
  const iframe = document.createElement('iframe');
  iframe.src = '/-/single/check-submitted';
  iframe.style.display = 'none';

  return new Promise((resolve) => {
    iframe.onload = () => {
      const value = getCookieValue(enketoOnceId, iframe.contentDocument);
      document.body.removeChild(iframe);
      resolve(value);
    };
    document.body.appendChild(iframe);
  });
};

const enketoSrc = ref();

const single = computed(() => {
  const { query } = route;
  return (props.actionType === 'public-link' && query.single !== 'false') ||
         (props.actionType === 'new' && query.single === 'true');
});

const setEnketoSrc = () => {
  let basePath = '/enketo-passthrough';
  // this is to avoid 404 warning
  if (buildMode === 'test') {
    basePath = `/#${basePath}`;
  }
  let prefix = basePath;
  const { return_url: _, returnUrl: __, ...query } = route.query;

  query.parentWindowOrigin = location.origin;

  // We need to use encodeURIComponent here instead of URLSearchParams because enketo expects space
  // to pass as either ' ' (literal space character) or '%20'. Whereas URLSearchParams converts
  // space into '+' sign.
  const qs = `?${Object.entries(query)
    .filter(([, value]) => typeof value === 'string')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&')}`;

  if (props.actionType === 'offline') {
    return; // we don't render offline Enketo through central-frontend
  }
  // for actionType 'new', we add '/single' only if 'single' query parameter is true
  // for actionType 'public-link', we add '/single' only if 'single' query parameter is not false
  if (single.value) {
    prefix += '/single';
  } else if (props.actionType === 'preview') {
    prefix += `/${props.actionType}`;
  }

  // we no longer render Enketo for Edit Submission from central-frontend.

  if (props.enketoId === form.enketoOnceId) {
    lastSubmitted(props.enketoId)
      .then(result => {
        if (result) {
          enketoSrc.value = `${basePath}/thanks?taken=${result}`;
        } else {
          enketoSrc.value = `${prefix}/${props.enketoId}${qs}`;
        }
      });
  } else {
    enketoSrc.value = `${prefix}/${props.enketoId}${qs}`;
  }

  emit('loaded');
};

setEnketoSrc();

const handleIframeMessage = (event) => {
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

    if (eventData?.enketoEvent === 'submissionsuccess') {
      if (redirectUrl.value && single.value) {
        // for public link, we read return value from query parameter. The value could be 3rd party
        // site as well, typically a thank you page
        try {
          const normalizedUrl = new URL(redirectUrl.value);
          if (['http:', 'https:'].includes(normalizedUrl.protocol)) {
            if (normalizedUrl.origin === location.origin) {
              router.push(normalizedUrl.pathname);
            } else {
              location.assign(normalizedUrl);
            }
          }
        } catch (e) {}
      }
    }
  }
};

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
