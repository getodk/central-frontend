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
  <div v-if="count > 0" id="form-trash-list">
    <details :open="!isFormTrashCollapsed" @toggle="onToggleTrashExpansion">
      <summary>
        <div id="form-trash-list-header">
          <span id="form-trash-list-title">
            <span id="form-trash-expander" :class="{ 'icon-chevron-right': isFormTrashCollapsed, 'icon-chevron-down': !isFormTrashCollapsed }"></span>
            <span class="icon-trash"></span>
            <span>{{ $t('title') }}</span>
          </span>
          <span id="form-trash-list-count">{{ $t('trashCount', { count: $n(count, 'default') }) }}</span>
          <span id="form-trash-list-note">{{ $t('message') }}</span>
        </div>
      </summary>
      <table id="form-trash-list-table" class="table">
        <tbody>
          <form-trash-row v-for="form of sortedDeletedForms" :key="form.id" :form="form"
            @start-restore="restoreForm.show({ form: $event })"/>
        </tbody>
      </table>
      <form-restore v-bind="restoreForm" @hide="restoreForm.hide()"
        @success="afterRestore"/>
    </details>
  </div>
</template>

<script>
import { ascend, sortWith } from 'ramda';

import FormTrashRow from './trash-row.vue';
import FormRestore from './restore.vue';

import { apiPaths } from '../../util/request';
import { modalData } from '../../util/reactivity';
import { noop } from '../../util/util';
import { useRequestData } from '../../request-data';

export default {
  name: 'FormTrashList',
  components: { FormTrashRow, FormRestore },
  inject: ['alert'],
  emits: ['restore'],
  setup() {
    // The component does not assume that this data will exist when the
    // component is created.
    const { project, deletedForms, currentUser } = useRequestData();
    return { project, deletedForms, currentUser, restoreForm: modalData() };
  },
  computed: {
    count() {
      return (this.deletedForms.dataExists ? this.deletedForms.length : 0);
    },
    sortedDeletedForms() {
      const sortByDeletedAt = sortWith([ascend(entry => entry.deletedAt)]);
      return sortByDeletedAt(this.deletedForms.data);
    },
    isFormTrashCollapsed() {
      return this.currentUser.preferences.projects[this.project.id].formTrashCollapsed;
    },
  },
  created() {
    this.fetchDeletedForms(false);
  },
  methods: {
    fetchDeletedForms(resend) {
      this.deletedForms.request({
        url: apiPaths.deletedForms(this.project.id),
        extended: true,
        resend
      }).catch(noop);
    },
    afterRestore() {
      this.alert.success(this.$t('alert.restore', { name: this.restoreForm.form.name }));
      this.restoreForm.hide();

      // refresh trashed forms list
      this.fetchDeletedForms(true);

      // tell parent component (ProjectOverview) to refresh regular forms list
      // (by emitting event to that component's parent)
      this.$emit('restore');
    },
    onToggleTrashExpansion(evt) {
      const projProps = this.currentUser.preferences.projects[this.project.id];
      if (evt.newState === 'closed') projProps.formTrashCollapsed = true;
      else if (projProps.formTrashCollapsed) projProps.formTrashCollapsed = false;
    },
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/mixins';
#form-trash-list {
  #form-trash-list-header {
    display: flex;
    align-items: center;
    cursor: pointer;

    #form-trash-expander {
      // Fixate the width as icon-chevron-down and icon-chevron-right have unequal width :-(
      display: inline-block;
      width: 1em;
      margin-right: 15px;
      font-size: 12px;
    }

    .icon-trash {
      padding-right: 8px;
    }

    .trash-count {
      font-weight: normal;
      color: black;
    }

    #form-trash-list-title {
      font-size: 26px;
      font-weight: 700;
      color: $color-danger;
      display: flex;
      align-items: center;
    }

    #form-trash-list-count {
      font-size: 20px;
      color: #888;
      padding-left: 4px;
    }

    #form-trash-list-note {
      margin-left: auto;
      color: #888
    }
  }

  // Hides default chevron in safari
  summary::-webkit-details-marker {
    display: none;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    "title": "Trash",
    // {count} is the number of Forms in the trash.
    "trashCount": "({count})",
    "alert": {
      "restore": "The Form “{name}” has been successfully restored."
    },
    "message": "Forms and Form-related data are deleted after 30 days in the Trash"
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "title": "Koš",
    "trashCount": "({count})",
    "message": "Formuláře a data související s formuláři jsou po 30 dnech odstraněny do koše."
  },
  "de": {
    "title": "Papierkorb",
    "trashCount": "{count}",
    "alert": {
      "restore": "Das Formular \"{name}\" wurde erfolgreich wiederhergestellt."
    },
    "message": "Formulare und formularbezogene Daten werden nach 30 Tagen im Papierkorb gelöscht"
  },
  "es": {
    "title": "Papelera",
    "trashCount": "({count})",
    "alert": {
      "restore": "El formulario {name} fue restablecido correctamente."
    },
    "message": "Los formularios y los datos relacionados con los formularios se eliminan después de 30 días en la Papelera"
  },
  "fr": {
    "title": "Corbeille",
    "trashCount": "({count})",
    "alert": {
      "restore": "Le Formulaire \"{name}\" a été restauré."
    },
    "message": "Le formulaire et les données associées sont supprimés après 30 jours passés dans la corbeille"
  },
  "id": {
    "title": "Sampah"
  },
  "it": {
    "title": "Cestino",
    "trashCount": "({count})",
    "alert": {
      "restore": "Il formulario “{name}” è stato ripristinato con successo."
    },
    "message": "I formulari e i dati relativi ai formulari vengono eliminati dopo 30 giorni nel Cestino"
  },
  "ja": {
    "title": "ゴミ箱",
    "trashCount": "({count})",
    "message": "フォームとフォームに関連したデータは30日後に削除されます。"
  },
  "pt": {
    "title": "Lixeira",
    "trashCount": "({count})",
    "alert": {
      "restore": "O Formulário \"{name}\" foi recuperado com sucesso."
    },
    "message": "Formulários e dados relacionados a Formulários são excluídos após 30 dias na Lixeira"
  },
  "sw": {
    "title": "Takataka",
    "trashCount": "({count})",
    "message": "Fomu na data inayohusiana na Fomu hufutwa baada ya siku 30 kwenye Tupio"
  },
  "zh": {
    "title": "回收站",
    "trashCount": "（{count}）",
    "alert": {
      "restore": "表单“{name}”已成功恢复。"
    },
    "message": "表单及相关数据在回收站保留30天后将被删除"
  },
  "zh-Hant": {
    "title": "垃圾桶",
    "trashCount": "({count})",
    "alert": {
      "restore": "表單「{name}」已成功還原。"
    },
    "message": "表單和表單相關資料將在 30 天後從垃圾箱中刪除"
  }
}
</i18n>
