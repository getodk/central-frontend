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
  <div id="dataset-show">
    <breadcrumbs v-if="dataExists" :links="breadcrumbLinks"/>
    <page-head v-show="dataExists">
      <template #title>
        {{ datasetName }}
      </template>
      <template #infonav>
        <infonav v-if="dataset.dataExists && dataset.sourceForms.length > 0">
          <template #title>
            <span class="icon-magic"></span>{{ $tc('infoNav.connectedForms', dataset.sourceForms.length) }}
          </template>
          <template #dropdown>
            <li v-for="form in dataset.sourceForms" :key="form.xmlFormId">
              <form-link :form="form" :to="publishedFormPath(form.projectId, form.xmlFormId)"/>
            </li>
          </template>
        </infonav>
        <infonav v-if="dataset.dataExists && dataset.linkedForms.length > 0">
          <template #title>
            <span class="icon-chain"></span>{{ $tc('infoNav.linkedForms', dataset.linkedForms.length) }}
          </template>
          <template #dropdown>
            <li v-for="form in dataset.linkedForms" :key="form.xmlFormId">
              <form-link :form="form" :to="publishedFormPath(form.projectId, form.xmlFormId)"/>
            </li>
          </template>
        </infonav>
      </template>
      <template #tabs>
        <li :class="tabClass('entities')" role="presentation">
          <router-link :to="tabPath('entities')">
            {{ $t('resource.entities') }}
            <span v-if="dataset.dataExists" class="badge">
              {{ $n(dataset.entities, 'default') }}
            </span>
          </router-link>
        </li>
        <li :class="tabClass('properties')" role="presentation">
          <router-link :to="tabPath('properties')">
            {{ $t('resource.properties') }}
            <span v-if="dataset.dataExists" class="badge">
              {{ $n(dataset.properties.length, 'default') }}
            </span>
          </router-link>
        </li>
        <li v-if="canRoute(tabPath('settings'))" :class="tabClass('settings')" role="presentation">
          <router-link :to="tabPath('settings')">
            {{ $t('common.tab.settings') }}
          </router-link>
        </li>
      </template>
    </page-head>
    <page-body>
      <loading :state="initiallyLoading"/>
      <router-view v-show="dataExists" @fetch-dataset="fetchDataset"/>
    </page-body>
  </div>
</template>

<script>
import Breadcrumbs from '../breadcrumbs.vue';
import FormLink from '../form/link.vue';

import Infonav from '../infonav.vue';
import Loading from '../loading.vue';
import PageBody from '../page/body.vue';
import PageHead from '../page/head.vue';

import useRoutes from '../../composables/routes';
import useTabs from '../../composables/tabs';
import { useRequestData } from '../../request-data';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';

export default {
  name: 'DatasetShow',
  components: {
    Breadcrumbs,
    FormLink,
    Infonav,
    Loading,
    PageBody,
    PageHead
  },
  props: {
    projectId: {
      type: String,
      required: true
    },
    datasetName: {
      type: String,
      required: true
    }
  },
  setup() {
    // The component does not assume that this data will exist when the
    // component is created.
    const { project, dataset, resourceStates } = useRequestData();

    const { projectPath, datasetPath, canRoute, publishedFormPath } = useRoutes();
    const { tabPath, tabClass } = useTabs(datasetPath());
    return {
      project, dataset, ...resourceStates([project, dataset]),
      datasetPath, projectPath, tabPath, tabClass, canRoute, publishedFormPath
    };
  },
  computed: {
    breadcrumbLinks() {
      return [
        { text: this.project.nameWithArchived, path: this.projectPath('entity-lists'), icon: 'icon-archive' },
        { text: this.datasetName, path: this.datasetPath(), icon: 'icon-database' }
      ];
    }
  },
  created() {
    this.fetchData();
  },
  methods: {
    fetchProject(resend) {
      this.project.request({
        url: apiPaths.project(this.projectId),
        extended: true,
        resend
      }).catch(noop);
    },
    fetchDataset(resend) {
      this.dataset.request({
        url: apiPaths.dataset(this.projectId, this.datasetName),
        extended: true,
        resend
      }).catch(noop);
    },
    fetchData() {
      this.fetchProject(false);
      this.fetchDataset(false);
    }
  }
};
</script>

<i18n lang="json5">
{
  "en": {
    // This is shown at the top of the page.
    "back": "Back to Project Entities",
    "infoNav": {
      // This dropdown title refers to Entity Lists that are updated by a Form.
      "connectedForms": "Updated by {count} Form | Updated by {count} Forms",
      // This dropdown title refers to Entity Lists that are linked to a Form.
      "linkedForms": "Used in {count} Form | Used in {count} Forms"
    }
  },
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "back": "Zpět na projektové entity"
  },
  "de": {
    "back": "Zurück zu den Projekteinheiten",
    "infoNav": {
      "connectedForms": "Update durch {count} Formular | Update durch {count} Formulare",
      "linkedForms": "Verwendet in {count} Formular | Verwendet in {count} Formulare"
    }
  },
  "es": {
    "back": "Back to Project Entities",
    "infoNav": {
      "connectedForms": "Actualizar por {count} formulario | Actualizar por {count} formularios | Actualizar por {count} formularios",
      "linkedForms": "Utilizado en {count} formulario | Utilizado en {count} formularios | Utilizado en {count} formularios"
    }
  },
  "fr": {
    "back": "Retour aux entités du projet",
    "infoNav": {
      "connectedForms": "Mise à jour par {count} Formulaire | Mise à jour par {count} Formulaires | Mise à jour par {count} Formulaire(s)",
      "linkedForms": "Utilisée dans {count} Formulaire | Utilisée dans {count} Formulaires | Utilisée dans {count} Formulaire(s)"
    }
  },
  "it": {
    "back": "Torna alle Entità del progetto",
    "infoNav": {
      "connectedForms": "Aggiornato da {count} Formulario | Aggiornato da {count} Formulari | Aggiornato da {count} Formulari",
      "linkedForms": "Usato da {count} Formulario | Usato da {count} Formulari | Usato da {count} Formulari"
    }
  },
  "pt": {
    "back": "Voltar para Entidades do Projeto",
    "infoNav": {
      "connectedForms": "Atualizado por {count} Formulário | Atualizado por {count} Formulários | Atualizado por {count} Formulários",
      "linkedForms": "Utilizado em {count} Formulário | Utilizado em {count} Formulários | Utilizado em {count} Formulários"
    }
  },
  "sw": {
    "back": "Rudi kwenye vyombo vya Mradi"
  },
  "zh": {
    "back": "返回至项目实体",
    "infoNav": {
      "connectedForms": "由{count}个表单更新",
      "linkedForms": "用于{count}个表单"
    }
  },
  "zh-Hant": {
    "back": "返回專案實體",
    "infoNav": {
      "connectedForms": "由{count}個表格更新",
      "linkedForms": "用於{count}個表格"
    }
  }
}
</i18n>
