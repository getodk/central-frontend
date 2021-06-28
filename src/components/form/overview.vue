<!--
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div id="form-overview">
    <div class="row">
      <div class="col-xs-6">
        <form-overview-right-now v-if="form != null"
          @view-xml="showModal('viewXml')"/>
        <page-section condensed>
          <template #heading>
            <span>{{ $t('checklist') }}</span>
          </template>
          <template #body>
            <form-checklist
              @show-submission-options="showModal('submissionOptions')"/>
          </template>
        </page-section>
      </div>
      <div v-if="formDraft != null" id="form-overview-draft" class="col-xs-6">
        <page-section v-if="formDraft.isDefined()" condensed>
          <template #heading>
            <span>{{ $t('common.currentDraft') }}</span>
          </template>
          <template #body>
            <form-version-summary-item :version="formDraft.get()">
              <template #body>
                <i18n tag="p" path="draft.any.versionCaption.full">
                  <template #draftVersion>
                    <strong>{{ $t('draft.any.versionCaption.draftVersion') }}</strong>
                  </template>
                </i18n>
                <div>
                  <form-version-standard-buttons :version="formDraft.get()"
                    @view-xml="showModal('viewXml')"/>
                </div>
              </template>
            </form-version-summary-item>
            <form-draft-checklist/>
          </template>
        </page-section>
        <page-section v-else condensed>
          <template #heading>
            <span>{{ $t('draft.none.title') }}</span>
          </template>
          <template #body>
            <p>{{ $t('draft.none.body') }}</p>
          </template>
        </page-section>
      </div>
    </div>

    <form-version-view-xml v-bind="viewXml" @hide="hideModal('viewXml')"/>
    <project-submission-options v-bind="submissionOptions"
      @hide="hideModal('submissionOptions')"/>
  </div>
</template>

<script>
import FormChecklist from './checklist.vue';
import FormDraftChecklist from '../form-draft/checklist.vue';
import FormOverviewRightNow from './overview/right-now.vue';
import FormVersionStandardButtons from '../form-version/standard-buttons.vue';
import FormVersionSummaryItem from '../form-version/summary-item.vue';
import PageSection from '../page/section.vue';
import modal from '../../mixins/modal';
import { loadAsync } from '../../util/async-components';
import { requestData } from '../../store/modules/request';

export default {
  name: 'FormOverview',
  components: {
    FormChecklist,
    FormDraftChecklist,
    FormOverviewRightNow,
    FormVersionStandardButtons,
    FormVersionSummaryItem,
    FormVersionViewXml: loadAsync('FormVersionViewXml'),
    PageSection,
    ProjectSubmissionOptions: loadAsync('ProjectSubmissionOptions')
  },
  mixins: [
    modal({
      viewXml: 'FormVersionViewXml',
      submissionOptions: 'ProjectSubmissionOptions'
    })
  ],
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
  data() {
    return {
      // Modals
      viewXml: {
        state: false
      },
      submissionOptions: {
        state: false
      }
    };
  },
  // The component does not assume that this data will exist when the component
  // is created.
  computed: requestData(['form', 'formDraft'])
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#form-overview-draft {
  background-color: #ddd;
  margin-top: -$margin-top-page-body;
  padding-top: $margin-top-page-body;

  .page-section-heading > span:first-child {
    color: $color-accent-secondary;
  }

  .btn-default {
    background-color: #ccc;

    &:hover, &:focus, &:active:focus {
      background-color: #bbb;
      &[disabled] { background-color: #ccc; }
    }
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    // This is a title shown above a section of the page.
    "checklist": "Checklist",
    "draft": {
      "none": {
        // This is a title shown above a section of the page.
        "title": "No Current Draft",
        "body": "There is not currently a Draft version of this Form. If you want to make changes to the Form or its Media Files, start by creating a Draft using the button above."
      },
      "any": {
        "versionCaption": {
          "full": "{draftVersion} of this Form.",
          "draftVersion": "Draft version"
        }
      }
    }
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "checklist": "Odškrtávací seznam",
    "draft": {
      "none": {
        "title": "Žádný aktuální koncept",
        "body": "Aktuálně neexistuje pracovní verze tohoto formuláře. Pokud chcete provést změny ve formuláři nebo jeho mediálních souborech, začněte vytvořením konceptu pomocí tlačítka výše."
      },
      "any": {
        "versionCaption": {
          "full": "{draftVersion} tohoto formuláře.",
          "draftVersion": "Verze konceptu"
        }
      }
    }
  },
  "de": {
    "checklist": "Checkliste",
    "draft": {
      "none": {
        "title": "Kein aktueller Entwurf",
        "body": "Es gibt aktuell keine Entwurfsversion dieses Formulars. Wenn Sie Änderungen am Formular oder den dazugehörigen Mediendateien machen wollen, legen Sie mit der Schaltfläche oben erst einen Entwurf an."
      },
      "any": {
        "versionCaption": {
          "full": "{draftVersion} von diesem Formular.",
          "draftVersion": "Entwurfsversion"
        }
      }
    }
  },
  "es": {
    "checklist": "Lista de verificación",
    "draft": {
      "none": {
        "title": "Sin borrador actual",
        "body": "Actualmente no existe una versión borrador de este formulario. Si desea hacer cambios en el formulario o en sus archivos multimedia, empiece por crear un borrador por medio del botón que se encuentra arriba."
      },
      "any": {
        "versionCaption": {
          "full": "{draftVersion} de este formulario.",
          "draftVersion": "Versión borrador"
        }
      }
    }
  },
  "fr": {
    "checklist": "Liste de contrôle",
    "draft": {
      "none": {
        "title": "Pas d'ébauche en cours",
        "body": "Ce formulaire n'a pas actuellement d'ébauche en cours. Si vous souhaitez apporter des modifications au formulaire ou à ses fichiers multimédia, commencez par créer une nouvelle ébauche en utilisant le bouton ci-dessus."
      },
      "any": {
        "versionCaption": {
          "full": "{draftVersion} de ce formulaire.",
          "draftVersion": "Version d'ébauche"
        }
      }
    }
  },
  "id": {
    "checklist": "Daftar periksa",
    "draft": {
      "none": {
        "title": "Belum ada draf",
        "body": "Belum ada versi draf untuk formulir ini. Apabila Anda ingin membuat perubahan terhadap formulir atau file media di dalamnya, mulailah dengan membuat sebuah draf menggunakan tombol di atas."
      },
      "any": {
        "versionCaption": {
          "full": "{draftVersion} dari formulir ini.",
          "draftVersion": "Versi draf"
        }
      }
    }
  },
  "ja": {
    "checklist": "チェックリスト",
    "draft": {
      "none": {
        "title": "現在、下書きはありません。",
        "body": "現在、このフォームの下書きはありません。フォームやメディアファイルに変更を加えたい場合は、まず上のボタンで新規下書きを作成して下さい。"
      },
      "any": {
        "versionCaption": {
          "full": "このフォームの{draftVersion}",
          "draftVersion": "下書きバージョン"
        }
      }
    }
  }
}
</i18n>
