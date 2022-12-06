<!--
Copyright 2021 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <page-section id="submission-basic-details">
    <template #heading><span>{{ $t('common.basicInfo') }}</span></template>
    <template #body>
      <loading :state="initiallyLoading"/>
      <dl v-if="dataExists">
        <div>
          <dt>{{ $t('header.instanceId') }}</dt>
          <dd><span :title="submission.__id">{{ submission.__id }}</span></dd>
        </div>
        <div>
          <dt>{{ $t('header.submitterName') }}</dt>
          <dd>
            <span :title="submission.__system.submitterName">{{ submission.__system.submitterName }}</span>
          </dd>
        </div>
        <div>
          <dt>{{ $t('header.submissionDate') }}</dt>
          <dd><date-time :iso="submission.__system.submissionDate"/></dd>
        </div>
        <div>
          <dt>{{ $t('reviewState') }}</dt>
          <dd id="submission-basic-details-review-state">
            <span :class="reviewStateIcon(submission.__system.reviewState)"></span>
            <span>{{ $t(`reviewState.${submission.__system.reviewState}`) }}</span>
          </dd>
        </div>
        <div>
          <dt>{{ $t('formVersion') }}</dt>
          <dd>
            <form-version-string :version="submission.__system.formVersion"/>
          </dd>
        </div>
        <div v-if="submission.__system.deviceId != null">
          <dt>{{ $t('deviceId') }}</dt>
          <dd>
            <span :title="submission.__system.deviceId">{{ submission.__system.deviceId }}</span>
          </dd>
        </div>
        <div v-if="submissionVersion.userAgent != null">
          <dt>{{ $t('userAgent') }}</dt>
          <dd id="submission-basic-details-user-agent">
            <span :title="submissionVersion.userAgent">{{ submissionVersion.userAgent }}</span>
          </dd>
        </div>
        <div v-if="submission.__system.attachmentsExpected !== 0">
          <dt>{{ $t('attachments') }}</dt>
          <dd>
            <span>{{ attachments }}</span>
            <template v-if="missingAttachment">
              <span class="icon-exclamation-triangle"></span>
              <span>{{ $t('submission.missingAttachment') }}</span>
            </template>
          </dd>
        </div>
      </dl>
    </template>
  </page-section>
</template>

<script>
import DateTime from '../date-time.vue';
import FormVersionString from '../form-version/string.vue';
import Loading from '../loading.vue';
import PageSection from '../page/section.vue';

import useReviewState from '../../composables/review-state';
import { useRequestData } from '../../request-data';

export default {
  name: 'SubmissionBasicDetails',
  components: { DateTime, FormVersionString, Loading, PageSection },
  setup() {
    const { submission, submissionVersion, resourceStates } = useRequestData();
    const { reviewStateIcon } = useReviewState();
    return {
      submission, submissionVersion,
      ...resourceStates([submission, submissionVersion]),
      reviewStateIcon
    };
  },
  computed: {
    attachments() {
      const { attachmentsPresent, attachmentsExpected } = this.submission.__system;
      return this.$t('attachmentSummary', {
        present: this.$tcn('present', attachmentsPresent),
        expected: this.$tcn('expected', attachmentsExpected)
      });
    },
    missingAttachment() {
      const { attachmentsPresent, attachmentsExpected } = this.submission.__system;
      return attachmentsPresent !== attachmentsExpected;
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/mixins';

#submission-basic-details {
  margin-bottom: 35px;

  dd { @include text-overflow-ellipsis; }
  #submission-basic-details-user-agent { white-space: normal; }

  .icon-exclamation-triangle {
    color: $color-warning;
    margin-left: 12px;
    margin-right: $margin-right-icon;
  }
}

#submission-basic-details-review-state {
  [class^="icon-"] { margin-right: $margin-right-icon; }

  .icon-dot-circle-o { color: #999; }
  .icon-comments { color: $color-warning; }
  .icon-pencil { color: #666; }
  .icon-check-circle { color: $color-success; }
  .icon-times-circle { color: $color-danger; }
}
</style>

<i18n lang="json5">
{
  "en": {
    "reviewState": "Review State",
    "formVersion": "Form version",
    "deviceId": "Device ID",
    "userAgent": "User agent",
    // This refers specifically to Submission Attachments.
    "attachments": "Attachments",
    "present": "{count} file | {count} files",
    // This shows the number of files that were expected to be submitted.
    "expected": "{count} expected | {count} expected",
    // {present} shows the number of files that were submitted, and {expected}
    // shows the number of files that were expected to be submitted. For
    // example: "2 files / 3 expected"
    "attachmentSummary": "{present} / {expected}"
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "reviewState": "Stav kontroly",
    "formVersion": "Verze formuláře",
    "deviceId": "ID zařízení",
    "userAgent": "Uživatelský agent",
    "attachments": "Přílohy",
    "present": "{count} soubor | {count} soubory | {count} souborů | {count} soubory",
    "expected": "{count} očekáván | {count} očekávány | {count} očekáváno | {count} očekávány",
    "attachmentSummary": "{present} / {expected}"
  },
  "de": {
    "reviewState": "Überprüfungsstatus",
    "formVersion": "Formular Version",
    "deviceId": "Geräte-ID",
    "userAgent": "User-Agent",
    "present": "{count} Datei | {count} Dateien",
    "expected": "{count} erwartet | {count} erwartet",
    "attachmentSummary": "{present} / {expected}"
  },
  "es": {
    "reviewState": "Estado de revisión",
    "formVersion": "Versión formulario",
    "deviceId": "ID del dispositivo",
    "userAgent": "Agente de usuario",
    "present": "{count} file | {count} files | {count} files",
    "expected": "{count} expected | {count} esperado | {count} esperado",
    "attachmentSummary": "{present} / {expected}"
  },
  "fr": {
    "reviewState": "État",
    "formVersion": "Version de formulaire",
    "deviceId": "ID d'appareil",
    "userAgent": "\"User agent\"",
    "attachments": "Fichiers joints",
    "present": "{count} fichier | {count} fichiers | {count} fichiers",
    "expected": "{count} attendu | {count} attendus | {count} attendus",
    "attachmentSummary": "{present} / {expected}"
  },
  "id": {
    "reviewState": "Status ulasan",
    "deviceId": "ID Perangkat",
    "present": "{count} berkas",
    "expected": "{count} diharapkan",
    "attachmentSummary": "{present} / {expected}"
  },
  "it": {
    "reviewState": "Rivedi lo stato",
    "formVersion": "Versione formulario",
    "deviceId": "ID del dispositivo",
    "userAgent": "Agente utente",
    "present": "{count} file | {count} files | {count} files",
    "expected": "{count} atteso | {count} attesi | {count} attesi",
    "attachmentSummary": "{present} / {expected}"
  },
  "ja": {
    "reviewState": "レビュー・ステータス",
    "formVersion": "フォームのバージョン",
    "deviceId": "デバイスID",
    "userAgent": "ユーザーエージェント",
    "present": "{count}件の提出済メディアファイル",
    "expected": "{count}件の期待されるメディアファイル数",
    "attachmentSummary": "{present} / {expected}"
  },
  "sw": {
    "reviewState": "Kagua hali",
    "formVersion": "Toleo la fomu",
    "deviceId": "Kitambulisho cha Kifaa",
    "userAgent": "Wakala wa mtumiaji",
    "present": "faili {count} | faili {count}",
    "expected": "{count} inatarajiwa | {count} inatarajiwa",
    "attachmentSummary": "{present} / {expected}"
  }
}
</i18n>
