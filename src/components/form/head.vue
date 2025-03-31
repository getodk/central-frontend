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
  <div id="form-head">
    <breadcrumbs v-if="project.dataExists" :links="breadcrumbLinks"/>
    <page-head>
      <template #title>{{ form.dataExists ? form.nameOrId : '' }}</template>
      <template #infonav>
        <infonav v-if="project.dataExists && formDatasetDiff.dataExists && publishedAttachments.dataExists
          && uniqueDatasetCount > 0">
          <template #title>
            <span class="icon-magic-wand"></span>{{ $tc('infoNav.entityLists', uniqueDatasetCount) }}
          </template>
          <template #dropdown>
            <li v-if="formDatasetDiff.length > 0">
              <span class="dropdown-header">{{ $t('infoNav.updatedDatasets') }}</span>
            </li>
            <li v-for="dataset in formDatasetDiff" :key="dataset.name">
              <dataset-link :name="dataset.name" :project-id="project.id"/>
            </li>
            <li v-if="formDatasetDiff.length > 0 && publishedAttachments.linkedDatasets.length > 0"><hr class="dropdown-divider"></li>
            <li v-if="publishedAttachments.linkedDatasets.length > 0">
              <span class="dropdown-header">{{ $t('infoNav.attachedDatasets') }}</span>
            </li>
            <li v-for="dataset in publishedAttachments.linkedDatasets" :key="dataset">
              <dataset-link :name="dataset" :project-id="project.id"/>
            </li>
          </template>
        </infonav>
        <infonav v-if="appUserCount.dataExists" :link="projectPath('form-access')">
          <template #title><span class="icon-user"></span>{{ $tc('infoNav.appUsers', appUserCount.data) }}</template>
        </infonav>
      </template>
      <template #tabs>
        <!-- No v-if, because anyone who can navigate to the form should be able
        to navigate to .../submissions and .../versions. -->
        <li :class="formTabClass('submissions')" role="presentation">
          <router-link :to="tabPath('submissions')"
            v-tooltip.aria-describedby="formTabDescription">
            {{ $t('resource.submissions') }}
            <span v-if="form.dataExists" class="badge">
              {{ $n(form.submissions, 'default') }}
            </span>
          </router-link>
        </li>
        <!-- Using rendersFormTabs rather than canRoute(), because we want to
        render the tabs even if the form does not have a published version (in
        which case canRoute() will return `false`). -->
        <li v-if="rendersFormTabs" :class="formTabClass('public-links')"
          role="presentation">
          <router-link :to="tabPath('public-links')"
            v-tooltip.aria-describedby="formTabDescription">
            {{ $t('formHead.tab.publicAccess') }}
            <span v-if="form.dataExists" class="badge">
              {{ $n(form.publicLinks, 'default') }}
            </span>
          </router-link>
        </li>
        <li v-if="canRoute(tabPath('draft'))" :class="tabClass('draft')"
          role="presentation">
          <router-link :to="tabPath('draft')">
            {{ $t('formHead.tab.editForm') }}
            <span class="icon-pencil-square"></span>
          </router-link>
        </li>
        <li :class="formTabClass('versions')" role="presentation">
          <router-link :to="tabPath('versions')"
            v-tooltip.aria-describedby="formTabDescription">
            {{ $t('formHead.tab.versions') }}
          </router-link>
        </li>
        <li v-if="rendersFormTabs" :class="formTabClass('settings')"
          role="presentation">
          <router-link :to="tabPath('settings')"
            v-tooltip.aria-describedby="formTabDescription">
            {{ $t('common.tab.settings') }}
            <span v-if="form.dataExists" class="badge">
              {{ $t(`formState.${form.state}`) }}
            </span>
          </router-link>
        </li>
      </template>
    </page-head>
  </div>
</template>

<script>
import Breadcrumbs from '../breadcrumbs.vue';
import Infonav from '../infonav.vue';
import DatasetLink from '../dataset/link.vue';
import PageHead from '../page/head.vue';

import useRoutes from '../../composables/routes';
import useTabs from '../../composables/tabs';
import { useRequestData } from '../../request-data';

export default {
  name: 'FormHead',
  components: { Breadcrumbs, DatasetLink, Infonav, PageHead },
  setup() {
    // The component does not assume that this data will exist when the
    // component is created.
    const { project, form, formDatasetDiff, publishedAttachments, appUserCount } = useRequestData();

    const { projectPath, formPath, canRoute } = useRoutes();
    const { tabPath, tabClass } = useTabs(formPath());
    return {
      project, form,
      formDatasetDiff, publishedAttachments, appUserCount,
      projectPath, formPath, canRoute, tabPath, tabClass
    };
  },
  computed: {
    rendersFormTabs() {
      return this.project.dataExists && this.project.permits(['form.update']);
    },
    formTabDescription() {
      return this.form.dataExists && this.form.publishedAt == null
        ? this.$t('formNav.tabTitle')
        : null;
    },
    breadcrumbLinks() {
      return [
        { text: this.project.dataExists ? this.project.nameWithArchived : this.$t('resource.project'), path: this.projectPath(), icon: 'icon-archive' },
        { text: this.form.dataExists ? this.form.nameOrId : this.$t('resource.form'), path: this.form.publishedAt != null ? this.formPath() : '', icon: 'icon-file' }
      ];
    },
    uniqueDatasetCount() {
      const uniqueDatasets = new Set([
        ...this.formDatasetDiff.map(dataset => dataset.name),
        ...this.publishedAttachments.linkedDatasets
      ]);
      return uniqueDatasets.size;
    }
  },
  methods: {
    formTabClass(path) {
      const htmlClass = this.tabClass(path);
      if (this.form.dataExists && this.form.publishedAt == null)
        htmlClass.disabled = true;
      return htmlClass;
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#form-head {
  .icon-pencil-square {
    color: $color-accent-primary;
    font-size: 18px;
    margin-left: 3px;

    vertical-align: bottom;
    position: relative;
    bottom: 1px;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    "projectNav": {
      "action": {
        "back": "Back to Project Overview"
      }
    },
    "formNav": {
      // Tooltip text that will be shown when hovering over tabs for Submissions, Public Access, etc.
      "tabTitle": "Publish this Draft Form to enable these functions"
    },
    "infoNav": {
      "entityLists": "{count} Related Entity List | {count} Related Entity Lists",
      // This text is shown as a header in a dropdown about related entity lists updated by this form.
      "updatedDatasets": "Updates",
      // This text is shown as a header in a dropdown about related entity lists that are used as attachments by this form.
      "attachedDatasets": "Uses",
      "appUsers": "{count} App User assigned | {count} App Users assigned"
    }
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "projectNav": {
      "action": {
        "back": "Zpět na přehled projektu"
      }
    },
    "formNav": {
      "tabTitle": "Tyto funkce budou k dispozici, jakmile zveřejníte svůj koncept formuláře"
    },
    "draftNav": {
      "action": {
        "create": "Vytvořit nový koncept"
      }
    }
  },
  "de": {
    "projectNav": {
      "action": {
        "back": "Zurück zur Projektübersicht"
      }
    },
    "formNav": {
      "tabTitle": "Diese Funktionen stehen zur Verfügung, wenn Sie Ihren Entwurf veröffentlicht haben."
    },
    "draftNav": {
      "action": {
        "create": "Neuen Entwurf erstellen"
      }
    }
  },
  "es": {
    "projectNav": {
      "action": {
        "back": "Volver a la descripción general del proyecto."
      }
    },
    "formNav": {
      "tabTitle": "Estas funciones estarán disponibles una vez que publique su borrador de formulario."
    },
    "draftNav": {
      "action": {
        "create": "Crear un nuevo borrador"
      }
    }
  },
  "fr": {
    "projectNav": {
      "action": {
        "back": "Retourner à l'aperçu du projet"
      }
    },
    "formNav": {
      "tabTitle": "Ces fonctions seront disponibles quand vous publierez votre ébauche"
    },
    "draftNav": {
      "action": {
        "create": "Créer une nouvelle ébauche"
      }
    }
  },
  "id": {
    "projectNav": {
      "action": {
        "back": "Kembali ke Gambaran Proyek"
      }
    },
    "formNav": {
      "tabTitle": "Fungsi ini akan tersedia setelah Anda menerbitkan draf formulir Anda"
    },
    "draftNav": {
      "action": {
        "create": "Buat draf baru"
      }
    }
  },
  "it": {
    "projectNav": {
      "action": {
        "back": "Torna alla panoramica del progetto"
      }
    },
    "formNav": {
      "tabTitle": "Queste funzioni diventeranno disponibili una volta che avrai pubblicato la tua bozza del formulario"
    },
    "draftNav": {
      "action": {
        "create": "Crea una nuova bozza"
      }
    }
  },
  "ja": {
    "projectNav": {
      "action": {
        "back": "プロジェクトの概要に戻る"
      }
    },
    "formNav": {
      "tabTitle": "これらの機能は下書きフォームが公開された際に有効になります。"
    },
    "draftNav": {
      "action": {
        "create": "新規下書きの作成"
      }
    }
  },
  "pt": {
    "projectNav": {
      "action": {
        "back": "Voltar à visão geral do projeto"
      }
    },
    "formNav": {
      "tabTitle": "Essas funções estarão disponíveis quando você publicar o seu formulário de rascunho"
    },
    "draftNav": {
      "action": {
        "create": "Criar um novo rascunho"
      }
    }
  },
  "sw": {
    "projectNav": {
      "action": {
        "back": "Rudi kwa Muhtasari wa Mradi"
      }
    },
    "formNav": {
      "tabTitle": "Vipengele hivi vitapatikana mara tu utakapochapisha Rasimu ya Fomu yako"
    },
    "draftNav": {
      "action": {
        "create": "Unda Rasimu mpya"
      }
    }
  },
  "zh-Hant": {
    "projectNav": {
      "action": {
        "back": "返回專案概覽"
      }
    },
    "formNav": {
      "tabTitle": "一旦您發布草稿表單，這些功能將可用"
    },
    "draftNav": {
      "action": {
        "create": "建立新草稿"
      }
    }
  }
}
</i18n>
