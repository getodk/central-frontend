<template>
  <div id="entity-upload-errors">
    <p class="entity-upload-section-title">{{ $t('title') }}</p>
    <p>{{ $t('introduction') }}</p>

    <entity-upload-alert v-if="dataError != null" type="danger">
      <template #title>{{ $t('dataError') }}</template>
      <template #body>
        <p>{{ dataError }}</p>
      </template>
    </entity-upload-alert>
  </div>
</template>

<script setup>
import EntityUploadAlert from './alert.vue';

defineOptions({
  name: 'EntityUploadErrors'
});
defineProps({
  dataError: String
});
</script>

<style lang="scss">
#entity-upload-errors {
  margin-top: 20px;
}
</style>

<i18n lang="json5">
{
  "en": {
    // This text is shown above a section that lists errors in the user's data.
    "title": "Review errors",
    "introduction": "Errors must be fixed before you can upload Entities.",

    // @transifexKey component.EntityUploadDataError.title
    "dataError": "Data error"
  }
}
</i18n>
