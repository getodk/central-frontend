<!--
Copyright 2024 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div id="entity-upload-data-error" class="panel panel-danger">
    <div class="panel-heading">
      <h1 class="panel-title">{{ $t('title') }}</h1>
    </div>
    <div class="panel-body">{{ message }}</div>
  </div>
</template>

<script setup>
defineOptions({
  name: 'EntityUploadDataError'
});
defineProps({
  message: {
    type: String,
    required: true
  }
});
</script>

<style lang="scss">
#entity-upload-data-error { margin-top: 15px; }
</style>

<i18n lang="json5">
{
  "en": {
    "title": "Data error"
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "de": {
    "title": "Datenfehler"
  },
  "es": {
    "title": "Error de datos"
  },
  "fr": {
    "title": "Erreur de données"
  },
  "it": {
    "title": "Errore dati"
  },
  "pt": {
    "title": "Erro de dados"
  },
  "zh-Hant": {
    "title": "資料錯誤"
  }
}
</i18n>
