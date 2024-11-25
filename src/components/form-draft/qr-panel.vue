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
  <div class="form-draft-qr-panel">
    <collect-qr v-if="formDraft.dataExists" :settings="settings"
      error-correction-level="Q" :cell-size="3" draft/>
  </div>
</template>

<script setup>
import { computed, inject } from 'vue';
import { useI18n } from 'vue-i18n';

import CollectQr from '../collect-qr.vue';

import { apiPaths } from '../../util/request';
import { useRequestData } from '../../request-data';

defineOptions({
  name: 'FormDraftQrPanel'
});

const { resourceView } = useRequestData();
const formDraft = resourceView('formDraft', (data) => data.get());

const { t } = useI18n();
const projectId = inject('projectId');
const xmlFormId = inject('xmlFormId');
const settings = computed(() => {
  const { draftToken } = formDraft;
  const url = apiPaths.serverUrlForFormDraft(draftToken, projectId, xmlFormId);
  return {
    general: {
      server_url: `${window.location.origin}${url}`,
      form_update_mode: 'match_exactly',
      autosend: 'wifi_and_cellular'
    },
    project: {
      name: t('collectProjectName', { name: formDraft.nameOrId }),
      icon: '📝'
    },
    // Collect requires the settings to have an `admin` property.
    admin: {}
  };
});
</script>

<i18n lang="json5">
{
  "en": {
    // @transifexKey component.FormDraftTesting.collectProjectName
    // This text will be shown in ODK Collect when testing a Draft Form. {name}
    // is the title of the Draft Form.
    "collectProjectName": "[Draft] {name}",
  }
}
</i18n>
