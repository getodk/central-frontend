<template>
  <config-error :error="config.loadError"/>
</template>

<script setup>
import { F } from 'ramda';
import { inject } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';

import ConfigError from './config-error.vue';

defineOptions({
  name: 'ClientConfigError'
});

const { config } = inject('container');

// Since there was an error loading the config, we don't know how to render
// important parts of the app. For example, we don't know config.oidcEnabled, so
// we don't know how to render the login page. Here, we prevent the user from
// navigating to elsewhere in the app.
onBeforeRouteLeave(F);
</script>
