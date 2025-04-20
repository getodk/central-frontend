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
  <loading :state="!enketoSrc"/>
  <iframe v-if="enketoSrc" id="enketo-iframe" title="Enketo" :src="enketoSrc"></iframe>
</template>

<script setup>
import { computed, inject, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { queryString } from '../util/request';
import { useRequestData } from '../request-data';

import Loading from './loading.vue';
import useEventListener from '../composables/event-listener';
import useRoutes from '../composables/routes';

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

const { form } = useRequestData();
const route = useRoute();
const router = useRouter();
const { submissionPath } = useRoutes();

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
      const value = iframe.contentDocument.cookie.split(';')
        .map(c => c.trim())
        .find(c => c.startsWith(enketoOnceId))
        ?.split('=')[1];
      document.body.removeChild(iframe);
      resolve(value);
    };
    document.body.appendChild(iframe);
  });
};

const enketoSrc = ref();

const setEnketoSrc = () => {
  let basePath = '/enketo-passthrough';
  // this is to avoid 404 warning
  if (process.env.NODE_ENV === 'test') {
    basePath = `/#${basePath}`;
  }
  let prefix = basePath;
  const { return_url: _, returnUrl: __, ...query } = route.query;

  query.parentWindowOrigin = location.origin;

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

  if (props.enketoId === form.enketoOnceId) {
    lastSubmitted(props.enketoId)
      .then(result => {
        if (result) {
          enketoSrc.value = `${basePath}/thanks?taken=${result}`;
        } else {
          enketoSrc.value = `${prefix}/${props.enketoId}${queryString(query)}`;
        }
      });
  } else {
    enketoSrc.value = `${prefix}/${props.enketoId}${queryString(query)}`;
  }
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
      if (props.actionType === 'edit') {
        // for edit we always redirect to Submission details page
        router.push(submissionPath(form.projectId, form.xmlFormId, props.instanceId));
      } else if (props.actionType === 'public-link' && redirectUrl.value) {
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
