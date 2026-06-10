<template>
  <iframe v-if="enketoSrc" id="enketo-iframe" title="Enketo" :src="enketoSrc"></iframe>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { Form } from '../utils/api';

const getCookieValue = (key, doc) => {
  const cookie = doc.cookie.split(';')
    .map(cookie => cookie.trim())
    .find(cookie => cookie.startsWith(`${key}=`));
  return decodeURIComponent(cookie?.split('=')[1] || '');
};

interface EnketoIframeProps {
  enketoId: string | null; // may be the enketoOnceId
  form: Form;
  actionType: string;
  instanceId?: string | undefined;
}

const props = defineProps<EnketoIframeProps>();

defineOptions({
  name: 'EnketoIframe'
});

const buildMode = import.meta.env?.MODE ?? 'production';

const route = useRoute();
const router = useRouter();

const redirectUrl = computed(() => {
  const { return_url: returnUrlPascalCase, returnUrl } = route.query;
  if (returnUrlPascalCase && typeof returnUrlPascalCase === 'string') {
    return returnUrlPascalCase;
  }
  if (returnUrl && typeof returnUrl === 'string') {
    return returnUrl;
  }
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

const enketoSrc = ref<string | null>(null);

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

  query.parentWindowOrigin = window.location.origin;

  // We need to use encodeURIComponent here instead of URLSearchParams because enketo expects space
  // to pass as either ' ' (literal space character) or '%20'. Whereas URLSearchParams converts
  // space into '+' sign.
  const qs = `?${Object.entries(query)
    .filter(([, value]) => typeof value === 'string')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value as string)}`)
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

  const enketoId = props.enketoId ?? props.form.enketoId;
  if (enketoId === props.form.enketoOnceId) {
    lastSubmitted(enketoId)
      .then(result => {
        if (result) {
          enketoSrc.value = `${basePath}/thanks?taken=${result}`;
        } else {
          enketoSrc.value = `${prefix}/${enketoId}${qs}`;
        }
      });
  } else {
    enketoSrc.value = `${prefix}/${enketoId}${qs}`;
  }
};

setEnketoSrc();

const handleIframeMessage = (event) => {
  if (event.origin === window.location.origin) {
    const { parentWindowOrigin } = route.query;
    // For the cases where this page is embedded in external iframe, pass the event data to the
    // parent.
    if (window.location !== window.parent.location &&
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
            if (normalizedUrl.origin === window.location.origin) {
              router.push(normalizedUrl.pathname);
            } else {
              window.location.assign(normalizedUrl);
            }
          }
        } catch (e) {}
      }
    }
  }
};

const addListener = () => {
  window.addEventListener('message', handleIframeMessage, false);

  onBeforeUnmount(() => {
    window.removeEventListener('message', handleIframeMessage, false);
  });
};

addListener();
</script>

<style lang="scss">
#enketo-iframe {
  display: block;
  border: none;
  height: 100vh;
  width: 100%;
}
</style>
