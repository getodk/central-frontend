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
  <qr-panel class="form-draft-qr-panel">
    <template #title>{{ $t('title') }}</template>
    <template #body>
      <collect-qr v-if="formDraft.dataExists" :settings="settings"
        error-correction-level="Q" :cell-size="3" draft/>
      <i18n-t keypath="introduction.full" tag="p">
        <template #temporaryCode>
          <strong>{{ $t('introduction.temporaryCode') }}</strong>
        </template>
      </i18n-t>
      <p>{{ $t('stopsWorking') }}</p>
      <p>{{ $t('instructions') }}</p>
      <i18n-t keypath="codesForUsers.full" tag="p">
        <template #appUsers>
          <router-link :to="projectPath('app-users')">
            {{ $t('codesForUsers.appUsers') }}
          </router-link>
        </template>
      </i18n-t>
    </template>
  </qr-panel>
</template>

<script setup>
import { computed, inject } from 'vue';
import { useI18n } from 'vue-i18n';

import CollectQr from '../collect-qr.vue';
import QrPanel from '../qr-panel.vue';

import useRoutes from '../../composables/routes';
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

const { projectPath } = useRoutes();
</script>

<i18n lang="json5">
{
  "en": {
    // This is the title at the top of a pop-up. "Code" refers to a QR code.
    "title": "Testing Code",
    // @transifexKey component.FormDraftTesting.collectProjectName
    // This text will be shown in ODK Collect when testing a Draft Form. {name}
    // is the title of the Draft Form.
    "collectProjectName": "[Draft] {name}",
    "introduction": {
      // This is shown next to a QR code.
      "full": "This is a {temporaryCode}.",
      // "Code" refers to a QR code.
      "temporaryCode": "Temporary Testing Code"
    },
    // "It" refers to a temporary testing code.
    "stopsWorking": "It will stop working when you publish this Draft.",
    // The table is a table of test Submissions.
    "instructions": "Scan this QR code to configure Collect on a device for testing and submitting data to this test table.",
    "codesForUsers": {
      // "Codes" refers to "QR codes".
      "full": "To create codes to distribute to users, please see the {appUsers} page.",
      "appUsers": "App Users"
    }
  }
}
</i18n>
