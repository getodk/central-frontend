<!--
Copyright 2020 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div id="form-submissions">
    <loading :state="keys.initiallyLoading"/>
    <page-heading
      :title="deleted ? $t('deletedTitle', { formName: form.nameOrId }) : form.nameOrId"
      :help-text="deleted ? $t('purgeDescription') : null">
      <template v-if="deletedSubmissionCount.dataExists">
        <button v-if="canDelete && (deletedSubmissionCount.value > 0 || deleted)" type="button"
          class="btn toggle-deleted-submissions" :class="{ 'btn-danger': deleted, 'btn-link': !deleted }"
          @click="toggleDeleted">
          <span class="icon-trash"></span>{{ $tcn('action.toggleDeletedSubmissions', deletedSubmissionCount.value) }}
          <span v-show="deleted" class="icon-close"></span>
        </button>
      </template>
      <enketo-fill v-if="rendersEnketoFill" :form-version="form">
        <span class="icon-plus-circle"></span>{{ $t('action.createSubmission') }}
      </enketo-fill>
    </page-heading>
    <template v-if="keys.dataExists">
      <submission-list ref="submissionList" :project-id="projectId"
        :xml-form-id="xmlFormId" :deleted="deleted" :encrypted="hasEncryption"
        @fetch-keys="fetchKeys" @fetch-deleted-count="fetchDeletedCount"/>
    </template>
  </div>
</template>

<script>
import { watchEffect, computed } from 'vue';
import { useRouter } from 'vue-router';

import PageHeading from '../page/heading.vue';
import EnketoFill from '../enketo/fill.vue';
import Loading from '../loading.vue';
import SubmissionList from '../submission/list.vue';
import useQueryRef from '../../composables/query-ref';
import useSubmissions from '../../request-data/submissions';

import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
import { useRequestData } from '../../request-data';

export default {
  name: 'FormSubmissions',
  components: {
    PageHeading,
    EnketoFill,
    Loading,
    SubmissionList,
  },
  props: {
    projectId: {
      type: String,
      required: true
    },
    xmlFormId: {
      type: String,
      required: true
    }
  },
  setup() {
    const { project, form, createResource } = useRequestData();
    const { deletedSubmissionCount } = useSubmissions();
    const keys = createResource('keys');
    const router = useRouter();

    const deleted = useQueryRef({
      fromQuery: (query) => {
        if (typeof query.deleted === 'string' && query.deleted === 'true') {
          return true;
        }
        return false;
      },
      toQuery: (value) => ({
        deleted: value === true ? 'true' : null
      })
    });

    const canDelete = computed(() => project.dataExists && project.permits('submission.delete'));

    watchEffect(() => {
      if (deleted.value && project.dataExists && !canDelete.value) router.push('/');
    });

    return {
      project, form, keys,
      deletedSubmissionCount, canDelete, deleted
    };
  },
  computed: {
    rendersEnketoFill() {
      return this.project.dataExists &&
        this.project.permits('submission.create') && this.form.dataExists;
    },
    /*
    Disable some functionality (e.g., the "Analyze via OData" button) if:

      - There are encrypted submissions, or
      - There are no submissions yet, but the form is encrypted. In that case,
        there will never be decrypted submissions available to OData (as long as
        the form remains encrypted).
    */
    hasEncryption() {
      if (this.keys.dataExists && this.keys.length !== 0) return true;
      if (this.form.dataExists && this.form.keyId != null &&
        this.form.submissions === 0)
        return true;
      return false;
    }
  },
  created() {
    this.fetchKeys();
    if (!this.deleted) this.fetchDeletedCount();
  },
  methods: {
    fetchKeys() {
      this.keys.request({
        url: apiPaths.submissionKeys(this.projectId, this.xmlFormId)
      }).catch(noop);
    },
    fetchDeletedCount() {
      this.deletedSubmissionCount.request({
        method: 'GET',
        url: apiPaths.odataSubmissions(
          this.projectId,
          this.xmlFormId,
          this.draft,
          {
            $top: 0,
            $count: true,
            $filter: '__system/deletedAt ne null',
          }
        ),
        clear: false,
      }).catch(noop);
    },
    toggleDeleted() {
      const { path } = this.$route;
      this.$router.push(this.deleted ? path : `${path}?deleted=true`);
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#form-submissions {
  .toggle-deleted-submissions {
    margin-left: 8px;

    &.btn-link {
      color: $color-danger;
    }

    .icon-close { margin-left: 3px; }
  }
}
</style>

<i18n lang="json5">
  {
    "en": {
      "purgeDescription": "Submissions and Submission-related data are deleted after 30 days in the Trash",
      // `formName` is the title/xmlFormId of the Form.
      "deletedTitle": "{formName} (Deleted submissions)",
      "action": {
        "toggleDeletedSubmissions": "{count} deleted Submission | {count} deleted Submissions"
      }
    }
  }
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "analyzeDisabled": "Přístup k OData není dostupný kvůli šifrování formuláře"
  },
  "de": {
    "analyzeDisabled": "OData-Zugriff ist wegen Formularverschlüsselung nicht verfügbar.",
    "analyzeDisabledDeletedData": "Der OData-Zugriff ist für gelöschte Übermittlungen nicht verfügbar",
    "purgeDescription": "Übermittlungen und übermittlungsbezogene Daten werden nach 30 Tagen im Papierkorb gelöscht.",
    "action": {
      "toggleDeletedSubmissions": "{count} gelöscht Übermittlung | {count} gelöschte Übermittlungen"
    }
  },
  "es": {
    "analyzeDisabled": "El acceso a OData no está disponible debido al cifrado de Formulario",
    "analyzeDisabledDeletedData": "El acceso OData no está disponible para los envíos eliminados",
    "purgeDescription": "Los envíos y los datos relacionados con ellos se eliminan después de 30 días en la papelera.",
    "action": {
      "toggleDeletedSubmissions": "{count} Envío eliminado | {count} Envíos eliminados | {count} Envíos eliminados"
    }
  },
  "fr": {
    "analyzeDisabled": "L'accès à OData n'est pas disponible en raison du chiffrement du formulaire",
    "analyzeDisabledDeletedData": "L'accès OData n'est pas possible pour les soumissions supprimées.",
    "purgeDescription": "Les soumissions et les données associées sont supprimées aprés 30 jours passés dans la corbeille.",
    "action": {
      "toggleDeletedSubmissions": "{count} Soumission supprimée | {count} Soumissions supprimées | {count} Soumissions supprimées"
    }
  },
  "it": {
    "analyzeDisabled": "L'accesso OData non è disponibile a causa della crittografia del formulario",
    "analyzeDisabledDeletedData": "L'accesso OData non è disponibile per gli Invii cancellati",
    "purgeDescription": "Gli invii e i dati relativi agli invii vengono eliminati dopo 30 giorni nel Cestino.",
    "action": {
      "toggleDeletedSubmissions": "{count} invio cancellato | {count} invii cancellati | {count} invii cancellati"
    }
  },
  "pt": {
    "analyzeDisabled": "O acesso ao OData não está disponível devido à encriptação do Formulário",
    "analyzeDisabledDeletedData": "O acesso ao OData não está disponível devido às Respostas excluídas",
    "purgeDescription": "Respostas e dados relacionados a Respostas são deletados depois de 30 dias na Lixeira",
    "action": {
      "toggleDeletedSubmissions": "{count} Resposta excluída | {count} Respostas excluídas | {count} Respostas excluídas"
    }
  },
  "sw": {
    "analyzeDisabled": "Ufikiaji wa OData haupatikani kwa sababu ya usimbaji fiche wa Fomu"
  },
  "zh": {
    "analyzeDisabled": "由于表单加密，OData访问不可用",
    "analyzeDisabledDeletedData": "OData访问对已删除的提交不可用",
    "purgeDescription": "提交数据及相关数据在回收站保留30天后将被删除",
    "action": {
      "toggleDeletedSubmissions": "{count}条已删除的提交"
    }
  },
  "zh-Hant": {
    "analyzeDisabled": "由於表單加密，OData 存取不可用",
    "analyzeDisabledDeletedData": "對於已刪除的提交內容，OData 存取不可用",
    "purgeDescription": "提交內容和與提交內容相關的資料將在 30 天後從垃圾箱中刪除",
    "action": {
      "toggleDeletedSubmissions": "已刪除{count} 筆提交內容"
    }
  }
}
</i18n>
