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
    <div class="heading-with-button">
      <button id="project-form-access-save-button" type="button"
        class="btn btn-primary"
        :class="{ 'uncommitted-change': changeCount !== 0 }"
        :aria-disabled="saveDisabled" @click="save">
        <span class="icon-floppy-o"></span>{{ $t('action.save') }}
        <spinner :state="awaitingResponse"/>
      </button>
      <p>
        <span>{{ $t('heading[0]') }}</span>
        <sentence-separator/>
        <i18n-t keypath="moreInfo.clickHere.full">
          <template #clickHere>
            <doc-link to="central-projects/#managing-form-access">{{ $t('moreInfo.clickHere.clickHere') }}</doc-link>
          </template>
        </i18n-t>
      </p>
    </div>

    <loading :state="initiallyLoading"/>
    <template v-if="dataExists">
      <project-form-access-table :changes-by-form="changesByForm"
        @update:state="updateState"
        @update:field-key-access="updateFieldKeyAccess"
        @show-states="statesModal.show()"/>
      <p v-if="forms.length === 0" class="empty-table-message">
        {{ $t('emptyTable') }}
      </p>
    </template>

    <project-form-access-states v-bind="statesModal"
      @hide="statesModal.hide()"/>
  </div>
</template>

<script>
import DocLink from '../doc-link.vue';
import Loading from '../loading.vue';
import ProjectFormAccessStates from './form-access/states.vue';
import ProjectFormAccessTable from './form-access/table.vue';
import SentenceSeparator from '../sentence-separator.vue';
import Spinner from '../spinner.vue';

import useRequest from '../../composables/request';
import { apiPaths } from '../../util/request';
import { modalData } from '../../util/reactivity';
import { noop } from '../../util/util';
import { useRequestData } from '../../request-data';

export default {
  name: 'ProjectFormAccess',
  components: {
    DocLink,
    Loading,
    ProjectFormAccessStates,
    ProjectFormAccessTable,
    SentenceSeparator,
    Spinner
  },
  inject: ['alert', 'unsavedChanges'],
  props: {
    projectId: {
      type: String,
      required: true
    }
  },
  emits: ['fetch-forms', 'fetch-field-keys'],
  setup() {
    const { roles, project, forms, formSummaryAssignments, fieldKeys, resourceStates } = useRequestData();
    const { request, awaitingResponse } = useRequest();
    return {
      roles, project, forms, fieldKeys, formSummaryAssignments,
      ...resourceStates([roles, project, forms, fieldKeys, formSummaryAssignments]),
      request, awaitingResponse
    };
  },
  data() {
    return {
      changesByForm: null,
      changeCount: 0,
      statesModal: modalData()
    };
  },
  computed: {
    saveDisabled() {
      return !this.dataExists || this.changeCount === 0 ||
        this.awaitingResponse;
    },
    // Returns an object that maps each form's xmlFormId to a "field key access
    // object" for the form. The object indicates whether each app user has an
    // assignment to the form. It has a property for every app user with a
    // token, even those without an assignment to the form.
    fieldKeyAccessByForm() {
      const byFieldKey = {};
      for (const fieldKey of this.fieldKeys.withToken)
        byFieldKey[fieldKey.id] = false;

      const byForm = Object.create(null);
      for (const form of this.forms)
        byForm[form.xmlFormId] = { ...byFieldKey };

      for (const assignment of this.formSummaryAssignments) {
        const forForm = byForm[assignment.xmlFormId];
        // Skip any assignment whose form is not in this.forms or whose app user
        // is not in this.fieldKeys.withToken.
        if (forForm != null && forForm[assignment.actorId] != null)
          forForm[assignment.actorId] = true;
      }

      return byForm;
    },
    // This may need to change whenever we add a property to the Project or Form
    // class in Backend.
    projectToSave() {
      return {
        name: this.project.name,
        description: this.project.description,
        archived: this.project.archived,
        // If there is a form on Backend that is not in this.forms, then at
        // least right now, Backend will return a Problem response. In the
        // future, Backend may delete the form.
        forms: this.forms.map(form => {
          const changes = this.changesByForm[form.xmlFormId];

          const assignments = [];
          const roleId = this.roles.bySystem['app-user'].id;
          for (const fieldKey of this.fieldKeys.withToken) {
            if (changes.current.fieldKeyAccess[fieldKey.id])
              assignments.push({ actorId: fieldKey.id, roleId });
          }

          return {
            xmlFormId: form.xmlFormId,
            state: changes.current.state,
            // If there is an assignment on Backend whose app user is not in
            // this.fieldKeys.withToken, then Backend will delete the
            // assignment.
            assignments
          };
        })
      };
    }
  },
  watch: {
    dataExists: {
      handler(dataExists) {
        if (dataExists) this.initChangesByForm();
      },
      immediate: true
    },
    changeCount(newCount, oldCount) {
      this.unsavedChanges.plus(newCount - oldCount);
    }
  },
  created() {
    this.fetchData(false);
  },
  methods: {
    fetchData(resend) {
      this.$emit('fetch-forms', resend);
      this.$emit('fetch-field-keys', resend);
      Promise.allSettled([
        this.roles.request({ url: '/v1/roles', resend: false }),
        this.formSummaryAssignments.request({
          url: apiPaths.formSummaryAssignments(this.projectId, 'app-user'),
          resend
        })
      ]);
    },
    // initChangesByForm() initializes this.changesByForm. Contrary to what its
    // name may suggest, this.changesByForm does not store only changes. Rather,
    // it stores two snapshots for each form: one from before the user made any
    // changes, and one that includes any changes. Each snapshot includes the
    // form's state, as well as app user access to the form.
    initChangesByForm() {
      // Using Object.create(null) in case there is a form whose xmlFormId is
      // '__proto__'.
      this.changesByForm = Object.create(null);
      for (const form of this.forms) {
        const fieldKeyAccess = this.fieldKeyAccessByForm[form.xmlFormId];
        this.changesByForm[form.xmlFormId] = {
          previous: {
            state: form.state,
            fieldKeyAccess
          },
          current: {
            state: form.state,
            fieldKeyAccess: { ...fieldKeyAccess }
          }
        };
      }
    },
    updateState(form, state) {
      const changes = this.changesByForm[form.xmlFormId];
      const changedBeforeUpdate = changes.current.state !== changes.previous.state;
      changes.current.state = state;
      const changedAfterUpdate = changes.current.state !== changes.previous.state;
      if (changedAfterUpdate !== changedBeforeUpdate)
        this.changeCount += changedAfterUpdate ? 1 : -1;
    },
    updateFieldKeyAccess(form, fieldKey, accessible) {
      const changes = this.changesByForm[form.xmlFormId];
      const changedBeforeUpdate = changes.current.fieldKeyAccess[fieldKey.id] !==
        changes.previous.fieldKeyAccess[fieldKey.id];
      changes.current.fieldKeyAccess[fieldKey.id] = accessible;
      const changedAfterUpdate = accessible !==
        changes.previous.fieldKeyAccess[fieldKey.id];
      if (changedAfterUpdate !== changedBeforeUpdate)
        this.changeCount += changedAfterUpdate ? 1 : -1;
    },
    save() {
      this.request({
        method: 'PUT',
        url: apiPaths.project(this.projectId),
        data: this.projectToSave
      })
        .then(() => {
          this.fetchData(true);
          this.alert.success(this.$t('alert.success'));
          this.changesByForm = null;
          this.changeCount = 0;
        })
        .catch(noop);
    }
  }
};
</script>

<i18n lang="json5">
{
  "en": {
    "heading": [
      "App Users can only see and fill the Forms that they are explicity given access to in the table below. Project Managers and Data Collectors can use a web browser to fill out any Form in the Project that is in the Open state."
    ],
    "emptyTable": "There are no Forms to show.",
    "alert": {
      "success": "Your changes have been successfully saved."
    }
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "heading": [
      "Uživatelé aplikace mohou vidět a vyplnit pouze formuláře, k nimž mají výslovný přístup v níže uvedené tabulce. Projektoví manažeři a sběratelé dat mohou pomocí webového prohlížeče vyplnit jakýkoli formulář v projektu, který je ve stavu Otevřený."
    ],
    "emptyTable": "Nejsou k dispozici žádné formuláře."
  },
  "de": {
    "heading": [
      "Benutzer der App können nur diejenigen Formulare ansehen oder ausfüllen, für die sie expliziten Zugriff haben. Projekt-Manager und Datensammler können einen Browser benutzen, um beliebige Formulare im Projekt, die sich noch im offenen Zustand befinden, auszufüllen."
    ],
    "emptyTable": "Es gibt keine Formulare zum Anzeigen.",
    "alert": {
      "success": "Ihre Änderungen wurden erfolgreich gespeichert."
    }
  },
  "es": {
    "heading": [
      "Los usuarios móviles solo pueden ver y llenar los formularios a los que explícitamente se les ha dado acceso en la tabla siguiente. Los administradores de proyecto y recolectores de datos puede utilizar un navegador web para llenar cualquier formulario del proyecto que está en estado abierto."
    ],
    "emptyTable": "No existen formularios para mostrar.",
    "alert": {
      "success": "¡Sus modificaciones han sido guardadas correctamente!"
    }
  },
  "fr": {
    "heading": [
      "Les utilisateurs mobiles peuvent seulement voir et remplir les formulaires auxquels un accès leur a été donné dans le tableau ci-dessous. Les gestionnaires de projet et collecteurs de données peuvent utiliser leurs navigateurs pour remplir tous les formulaires de ce projet dans l'état \"ouvert\"."
    ],
    "emptyTable": "Il n'y a pas de formulaire à afficher.",
    "alert": {
      "success": "Vos modifications ont été enregistrées."
    }
  },
  "id": {
    "heading": [
      "Pengguna Aplikasi hanya bisa melihat dan mengisi formulir yang aksesnya telah diberikan kepada mereka pada tabel di bawah ini. Manajer Proyek dan pengumpul data dapat menggunakan web browser untuk mengisi formulir apapun dalam Proyek yang statusnya adalah Terbuka."
    ],
    "emptyTable": "Tidak ada formulir untuk ditampilkan."
  },
  "it": {
    "heading": [
      "Gli utenti app possono visualizzare e compilare solo i formulari a cui hanno esplicito accesso nella tabella sottostante. I project manager e i raccoglitori di dati possono utilizzare un browser Web per compilare qualsiasi formulario nel progetto che si trova nello stato Aperto."
    ],
    "emptyTable": "Non ci sono formulari da mostrare.",
    "alert": {
      "success": "I tuoi cambi sono stati salvati con successo!"
    }
  },
  "ja": {
    "heading": [
      "アプリユーザーは、以下の表で明示的にアクセス権限を与えられたフォームに対してのみ、閲覧・記入ができます。プロジェクト・マネージャーとデータ収集者は、Webブラウザを使って、公開状態のプロジェクト内のどのフォームにも、記入できます。"
    ],
    "emptyTable": "表示できるフォームはありません。"
  },
  "pt": {
    "heading": [
      "Usuários de aplicativo somente podem ver e preencher os formulários para os quais receberem autorização explícita na tabela abaixo. Gerentes de projeto e coletores de dados podem usar um navegador de internet para preencher qualquer formulário no projeto que esteja com status Aberto."
    ],
    "emptyTable": "Não há formulários para exibir.",
    "alert": {
      "success": "Suas alterações foram salvas com sucesso."
    }
  },
  "sw": {
    "heading": [
      "Watumiaji wa Programu wanaweza tu kuona na kujaza Fomu ambazo wamepewa ufikiaji wa uwazi katika jedwali lililo hapa chini. Wasimamizi wa Miradi na Wakusanyaji Data wanaweza kutumia kivinjari cha wavuti kujaza Fomu yoyote katika Mradi ambayo iko katika hali ya Wazi."
    ],
    "emptyTable": "Hakuna Fomu za kuonyesha."
  },
  "zh": {
    "heading": [
      "应用用户仅可查看并填写下方表格中明确授权的表单。项目经理和数据收集员可通过网页浏览器填写项目中处于“开放”状态的任何表单。"
    ],
    "emptyTable": "暂无表单可显示。",
    "alert": {
      "success": "您的修改已成功保存。"
    }
  },
  "zh-Hant": {
    "heading": [
      "於下表中，明確授予 APP使用者 只能查看並填寫表格的存取權限。專案管理員和資料收集者可以使用 Web 瀏覽器填寫，於專案處於公開狀態的任何表格。"
    ],
    "emptyTable": "沒有可顯示的表格。",
    "alert": {
      "success": "您的變更已成功儲存。"
    }
  }
}
</i18n>
