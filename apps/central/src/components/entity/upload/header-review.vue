<template>
  <div id="entity-upload-header-review">
    <p>{{ $t('title') }}</p>

    <template v-if="missingProperties != null">
      <p>{{ $tc('missingProperties', missingProperties.length) }}</p>
      <p><i18n-list :list="missingProperties"/></p>
    </template>
  </div>
</template>

<script setup>
import I18nList from '../../i18n/list.vue';

defineOptions({
  name: 'EntityUploadHeaderReview'
});
defineProps({
  missingProperties: Array
});
</script>

<style lang="scss">
#entity-upload-header-review {
  margin-top: 18px;

  p {
    &:first-child { font-weight: bold; }

    &:has(.i18n-list) {
      font-size: 14px;
      margin-left: 8px;
    }
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    // This text is shown above a section where the user can review warnings
    // about their data.
    "title": "Review data",
    // This text is followed by a list of Entity property names.
    "missingProperties": "This property is not included in your file and will be left empty: | These properties are not included in your file and will be left empty:"
  }
}
</i18n>
