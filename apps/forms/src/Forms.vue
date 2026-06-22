<script setup lang="ts">
import { onMounted } from 'vue';
import { RouterView } from 'vue-router';

onMounted(() => {
  if (globalThis.__deregisterInitializationErrorHandling) {
    globalThis.__deregisterInitializationErrorHandling();
  }
});
</script>

<template>
  <RouterView/>
</template>
