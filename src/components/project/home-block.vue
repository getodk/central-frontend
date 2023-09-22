<!--
Copyright 2022 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div class="project-home-block">
    <div class="title">
      <router-link :to="projectPath(project.id)">{{ project.name }}</router-link>
      <template v-if="project.keyId">
        <span class="encrypted badge" aria-hidden="true" v-tooltip.sr-only>
          <span class="icon-lock"></span>
          {{ $t('encrypted') }}
        </span>
        <span class="sr-only">{{ $t('encryptionTip') }}</span>
      </template>
    </div>
    <table v-if="visibleForms.length > 0 || visibleDataset.length > 0" class="project-table table">
      <project-form-row v-for="(form, index) of visibleForms" :key="form.xmlFormId" :form="form" :project="project" :show-icon="index === 0"/>
      <tr v-if="showExpander" class="project-form-row transparent-bg">
        <td class="col-icon"></td>
        <td colspan="6" class="expand-button-container">
          <a href="#" role="button" class="expand-button" @click.prevent="toggleExpanded">
            <template v-if="!formExpanded">
              {{ $tcn('showMore', numForms) }}<span class="icon-angle-down"></span>
            </template>
            <template v-else>
              {{ $tcn('showFewer', numForms) }}<span class="icon-angle-up"></span>
            </template>
          </a>
        </td>
      </tr>

      <tr v-if="visibleForms.length > 0 && visibleDataset.length > 0" class="margin">
        <td class="col-icon"></td>
      </tr>
      <project-dataset-row v-for="(dataset, index) of visibleDataset" :key="dataset.name" :dataset="dataset" :project="project" :show-icon="index === 0"/>
      <tr v-if="showDatasetExpander" class="project-dataset-row transparent-bg">
        <td class="col-icon"></td>
        <td colspan="6" class="expand-button-container">
          <a href="#" role="button" class="expand-button" @click.prevent="toggleDatasetExpanded">
            <template v-if="!datasetExpanded">
              {{ $tcn('showMoreDatasets', numDatasets) }}<span class="icon-angle-down"></span>
            </template>
            <template v-else>
              {{ $tcn('showFewerDatasets', numDatasets) }}<span class="icon-angle-up"></span>
            </template>
          </a>
        </td>
      </tr>
    </table>
  </div>
</template>

<script>
import ProjectFormRow from './form-row.vue';
import ProjectDatasetRow from './dataset-row.vue';

import useRoutes from '../../composables/routes';

export default {
  name: 'ProjectHomeBlock',
  components: { ProjectFormRow, ProjectDatasetRow },
  props: {
    project: {
      type: Object,
      required: true
    },
    sortFunc: {
      type: Function,
      required: true
    },
    maxForms: {
      type: Number,
      default: 3
    },
    maxDatasets: {
      type: Number,
      default: 3
    }
  },
  setup() {
    const { projectPath } = useRoutes();
    return { projectPath };
  },
  data() {
    return {
      formExpanded: false,
      datasetExpanded: false
    };
  },
  computed: {
    visibleForms() {
      const sortedForms = this.project.formList.filter((f) => f.state !== 'closed');
      sortedForms.sort(this.sortFunc);
      return this.formExpanded
        ? sortedForms
        : sortedForms.slice(0, this.maxForms);
    },
    visibleDataset() {
      const sortedDatasets = this.project.datasetList;
      sortedDatasets.sort(this.sortFunc);

      return this.datasetExpanded
        ? sortedDatasets
        : sortedDatasets.slice(0, this.maxDatasets);
    },
    showExpander() {
      return this.numForms > this.maxForms;
    },
    numForms() {
      return this.project.formList.filter((f) => f.state !== 'closed').length;
    },
    showDatasetExpander() {
      return this.numDatasets > this.maxDatasets;
    },
    numDatasets() {
      return this.project.datasetList.length;
    }
  },
  methods: {
    toggleExpanded() {
      this.formExpanded = !this.formExpanded;
    },
    toggleDatasetExpanded() {
      this.datasetExpanded = !this.datasetExpanded;
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/mixins';
@import '../../assets/scss/_variables.scss';

.project-home-block {
  margin-bottom: 15px;

  .title {
    font-size: 24px;
    font-weight: bold;
    letter-spacing: -0.02em;
    margin-bottom: 5px;
    background-color: $color-page-background;
    box-shadow: 0 0 20px $color-page-background;
    position: sticky;
    top: 0;
  }

  .encrypted {
    margin-left: 9px;
    color: #333;
    background-color: #ddd;
    border: 1px solid #ccc;
    font-weight: 400;
  }

  padding-right: 12px;

  table {
    margin-left: 9px;
    margin-bottom: 4px;
  }

  .expand-button-container {
    padding-left: 6px;
    font-size: 14px;
    color: #888;
  }
  .expand-button {
    @include text-link;
    &:focus {
      background-color: transparent;
    }
  }


  .icon-angle-down, .icon-angle-up {
    margin-left: 5px;
  }

  .project-table {

    .transparent-bg{
      background: transparent !important;
    }

    tr:first-child .col-icon {
      border-top-left-radius: 5px;
    }

    tr:last-child .col-icon {
      border-bottom-left-radius: 5px;
    }

    tr:nth-child(3n + 2 of .project-form-row) {
      background: #eee;
    }

    tr:nth-child(3n + 2 of .project-dataset-row) {
      background: #eee;
    }

    .col-icon {
      width: 35px;
      background: #e3e4e4;
      border-right-width: 2px;
      border-right-style: solid;
      padding: 5px 0px;
      text-align: center;

      span {
        margin-left: 0;
      }

    }

    .project-form-row .col-icon {
      border-right-color: #009ccc;

      span {
        color: #009ccc;

      }
    }

    .project-dataset-row .col-icon{
      border-right-color: #b9005c;

      span {
        color: #b9005c;

      }
    }

    .margin {
      height: 5px;

      .col-icon {
        border-right: none;
        width: 33px;
      }
    }
  }



}
</style>


<i18n lang="json5">
{
  "en": {
    // This text is shown in a small label next to a Project name to indicate that the Project is encrypted.
    "encrypted": "Encrypted",
    "encryptionTip": "This Project uses managed encryption.",
    // This clickable text is shown below a table of forms where only a few out of the total number ("count") of forms is shown.
    "showMore": "Show {count} total Form | Show {count} total Forms",
    // This clickable text is shown below a table of entity lists where only a few out of the total number ("count") of entity lists is shown.
    "showMoreDatasets": "Show {count} total Entity List | Show {count} total Entity Lists",
    // This clickable text is shown below an expanded table of forms that can be collapsed to hide some forms.
    // "Count" refers to the number of forms.
    "showFewer": "Show fewer of {count} total Form | Show fewer of {count} total Forms",
    // This clickable text is shown below an expanded table of entity lists that can be collapsed to hide some entity list.
    // "Count" refers to the number of entity lists.
    "showFewerDatasets": "Show fewer of {count} total Entity List | Show fewer of {count} total Entity Lists"
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "encrypted": "Šifrováno",
    "encryptionTip": "Tento projekt používá řízené šifrování."
  },
  "de": {
    "encrypted": "Verschlüsselt",
    "encryptionTip": "Dieses Projekt verwendet verwaltete Verschlüsselung."
  },
  "es": {
    "encrypted": "Cifrado",
    "encryptionTip": "Este proyecto utiliza cifrado administrado."
  },
  "fr": {
    "encrypted": "Chiffré",
    "encryptionTip": "Ce projet utilise un chiffrement des données."
  },
  "id": {
    "encrypted": "Terenkripsi",
    "encryptionTip": "Proyek ini menggunakan enkripsi terkelola."
  },
  "it": {
    "encrypted": "Crittografato",
    "encryptionTip": "Questo progetto utilizza la crittografia gestita."
  },
  "sw": {
    "encrypted": "Imesimbwa kwa njia fiche",
    "encryptionTip": "Mradi huu unatumia usimbaji fiche unaodhibitiwa."
  }
}
</i18n>
