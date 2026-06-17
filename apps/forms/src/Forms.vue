<script setup lang="ts">
import { onMounted } from 'vue';
import { RouterView } from 'vue-router';

onMounted(() => {
  globalThis.__deregisterInitializationErrorHandling();
});
</script>

<template>
  <RouterView/>
</template>
