<template>
  <ul v-if="!selectForm">
      <li v-for="form in demoForms">
        {{ form[0] }}
          <button @click="selectForm = form">Show</button>
      </li>
  </ul>
  <div v-else>
      <button @click="selectForm = null">Back</button>
      <OdkForm v-if="selectForm" :form-xml="selectForm[1]" />  
  </div>
	
</template>

<script setup lang="ts">
import { ref } from 'vue';
import OdkForm from './components/OdkForm.vue';

const formFixtureGlobImports = import.meta.glob('../../ui-solid/fixtures/xforms/**/*.xml', {
    query: '?raw',
    import: 'default',
    eager: true,
});
const demoForms = Object.entries(formFixtureGlobImports) as [string, string][];

demoForms.forEach(f => {
    f[0] = f[0].replace('../../ui-solid/fixtures/xforms/', '')
})


const selectForm = ref<[string, string] | null>(null);



</script>


<style>

</style>
