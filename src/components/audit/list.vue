<!--
Copyright 2019 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div>
    <p class="page-body-heading">{{ $t('heading[0]') }}</p>
    <div class="table-actions-bar">
      <audit-filters v-model:action="action" v-model:dateRange="dateRange"/>
    </div>
    <audit-table/>
    <loading :state="audits.initiallyLoading"/>
    <p v-show="audits.dataExists && audits.length === 0"
      class="empty-table-message">
      {{ $t('emptyTable') }}
    </p>
  </div>
</template>

<script setup>
import { DateTime } from 'luxon';
import { watch } from 'vue';

import AuditFilters from './filters.vue';
import AuditTable from './table.vue';
import Loading from '../loading.vue';

import useAudit from '../../composables/audit';
import useQueryRef from '../../composables/query-ref';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
import { useRequestData } from '../../request-data';

defineOptions({
  name: 'AuditList'
});

const { createResource } = useRequestData();
const audits = createResource('audits');

const { categoryMessage, actionMessage } = useAudit();
const action = useQueryRef({
  fromQuery: (query) => (typeof query.action === 'string' &&
    (categoryMessage(query.action) != null || actionMessage(query.action) != null)
    ? query.action
    : 'nonverbose'),
  toQuery: (value) => ({ action: value === 'nonverbose' ? null : value })
});
const dateRange = useQueryRef({
  fromQuery: (query) => {
    if (typeof query.start === 'string' && typeof query.end === 'string') {
      const start = DateTime.fromISO(query.start);
      const end = DateTime.fromISO(query.end);
      if (start.isValid && end.isValid && start <= end)
        return [start.startOf('day'), end.startOf('day')];
    }
    const today = DateTime.local().startOf('day');
    return [today, today];
  },
  toQuery: (value) => {
    const today = DateTime.local().startOf('day');
    if (value[0].toMillis() === today.toMillis() &&
      value[1].toMillis() === today.toMillis())
      return { start: null, end: null };
    return { start: value[0].toISODate(), end: value[1].toISODate() };
  }
});

const fetchData = () => audits.request({
  url: apiPaths.audits({
    action: action.value,
    start: dateRange.value[0].toISO(),
    end: dateRange.value[1].endOf('day').toISO()
  }),
  extended: true
}).catch(noop);
fetchData();
watch([action, dateRange], fetchData);
</script>

<i18n lang="json5">
{
  "en": {
    "heading": [
      "Here you will find a log of significant actions performed on this server. Changes made to user, Project, or Form settings can be found here."
    ],
    "emptyTable": "There are no matching audit log entries."
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "heading": [
      "Zde najdete protokol významných akcí provedených na tomto serveru. Změny provedené v nastavení uživatele, projektu nebo formuláře najdete zde."
    ],
    "emptyTable": "Neexistují žádné odpovídající položky protokolu auditu."
  },
  "de": {
    "heading": [
      "Hier befinden sich Log-Einträge signifikanter Aktionen auf diesem Server, wie Änderungen von Benutzer-, Projekt-, oder Formulareinstellungen."
    ],
    "emptyTable": "Keine zutreffenden Audit-Logeinträge."
  },
  "es": {
    "heading": [
      "Aquí encontrará un registro de acciones significativas realizadas en este servidor. Los cambios realizados en la configuración de usuario, proyecto o formulario se pueden encontrar aquí."
    ],
    "emptyTable": "No hay entradas de registro de auditoría coincidentes."
  },
  "fr": {
    "heading": [
      "Vous trouverez ici un log des actions importantes effectuées sur le serveur. Les modifications apportées aux utilisateurs, projets ou formulaires se trouvent ici."
    ],
    "emptyTable": "Il n'y a pas d'entrée correspondante dans le journal d'audit."
  },
  "id": {
    "heading": [
      "Di sini Anda bisa menemukan catatan tindakan-tindakan yang dilakukan di server ini. Perubahan terhadap pengguna, proyek, atau pengaturan formulir dapat ditemukan di sini."
    ],
    "emptyTable": "Tidak ada catatan audit yang cocok."
  },
  "it": {
    "heading": [
      "Qui troverai un registro delle azioni significative eseguite su questo server. Le modifiche apportate alle impostazioni dell'utente, del progetto o del formulario sono disponibili qui."
    ],
    "emptyTable": "Non sono presenti voci del registro di controllo corrispondenti."
  },
  "ja": {
    "heading": [
      "ここでは、このサーバーで行われた重要な操作履歴を閲覧できます。ユーザーやプロジェクト、フォーム設定への変更は、ここで確認できます。"
    ],
    "emptyTable": "照合できる監査ログの記録がありません。"
  },
  "pt": {
    "heading": [
      "Aqui você encontrará um registro de auditoria de ações importantes realizadas nesse servidor. Alterações feitas a configurações de usuários, projetos ou formulários podem ser encontradas aqui."
    ],
    "emptyTable": "Não existem entradas correspondentes no registro de auditoria."
  },
  "sw": {
    "heading": [
      "Hapa utapata logi ya vitendo muhimu vilivyofanywa kwenye seva hii. Mabadiliko yaliyofanywa kwa mipangilio ya mtumiaji, Mradi, au Fomu yanaweza kupatikana hapa."
    ],
    "emptyTable": "Hakuna maingizo ya kumbukumbu ya ukaguzi yanayolingana"
  },
  "zh-Hant": {
    "heading": [
      "在這裡您將找到在此伺服器上執行的重要操作的日誌。可以在此處找到對使用者、專案或表單設定所做的變更。"
    ],
    "emptyTable": "沒有符合的審核日誌條目。"
  }
}
</i18n>
