<!--
Copyright 2023 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <a id="entity-download-button" class="btn btn-primary" :href="href">
    <span class="icon-arrow-circle-down"></span>{{ text }}
  </a>
</template>

<script setup>
import { computed, inject } from 'vue';

import { apiPaths } from '../../util/request';
import { useI18nUtils } from '../../util/i18n';
import { useRequestData } from '../../request-data';

const projectId = inject('projectId');
const datasetName = inject('datasetName');

const href = apiPaths.entities(projectId, datasetName);

const { dataset } = useRequestData();
const { tn } = useI18nUtils();
const text = computed(() => (dataset.dataExists
  ? tn('action.download.unfiltered', dataset.entities)
  : ''));
</script>

<i18n lang="json5">
{
  "en": {
    "action": {
      // @transifexKey component.EntityList.action.download
      "download": {
        "unfiltered": "Download {count} Entity | Download {count} Entities"
      }
    }
  }
}
</i18n>
