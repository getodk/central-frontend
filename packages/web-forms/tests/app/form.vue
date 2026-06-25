<script setup lang="ts">
import { useRoute } from 'vue-router';
import { getFormXml } from '../helpers';
import { ref } from 'vue';
import OdkWebForm from '../../src/components/OdkWebForm.vue';
const route = useRoute();
const formId = route.params.formId as string;

const formXml = ref<string | null>(null);
const init = async() => {
  formXml.value = await getFormXml(formId);
};

const getAttachment = (requestUrl: URL) => {
  return fetch(requestUrl);
};

const handleSubmit = () => {};
init();
</script>
<template>
  <template v-if="formXml">
    <OdkWebForm
      :form-xml="formXml"
      :fetch-form-attachment="getAttachment"
      @submit="handleSubmit"/>
  </template>
</template>
