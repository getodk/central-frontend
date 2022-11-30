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
  <div>
    <loading :state="formVersions.initiallyLoading"/>
    <div v-show="formVersions.dataExists" class="row">
      <div class="col-xs-6">
        <page-section>
          <template #heading>
            <span>{{ $t('draftChecklist.title') }}</span>
          </template>
          <template #body>
            <form-draft-checklist status/>
          </template>
        </page-section>
      </div>
      <div class="col-xs-6">
        <page-section>
          <template #heading>
            <span>{{ $t('common.currentDraft') }}</span>
          </template>
          <template #body>
            <summary-item v-if="formDraft.dataExists" icon="file-o">
              <template #heading>
                <form-version-string :version="formDraft.get().version"/>
              </template>
              <template #body>
                <i18n-t tag="p" keypath="currentDraft.versionCaption.full">
                  <template #draftVersion>
                    <strong>{{ $t('currentDraft.versionCaption.draftVersion') }}</strong>
                  </template>
                </i18n-t>
                <div id="form-draft-status-standard-buttons-container">
                  <form-version-standard-buttons :version="formDraft.get()"
                    @view-xml="showModal('viewXml')"/>
                </div>
                <div>
                  <button id="form-draft-status-upload-button" type="button"
                    class="btn btn-primary" @click="showModal('upload')">
                    <span class="icon-upload"></span>{{ $t('currentDraft.action.upload') }}&hellip;
                  </button>
                </div>
              </template>
            </summary-item>
            <dataset-summary v-if="formDraft.dataExists && formDraft.get().entityRelated"
              :is-draft="true"
              :project-id="Number(projectId)"
              :xml-form-id="xmlFormId"/>
          </template>
        </page-section>
        <page-section>
          <template #heading>
            <span>{{ $t('actions.title') }}</span>
          </template>
          <template #body>
            <button id="form-draft-status-publish-button" type="button"
              class="btn btn-primary" @click="showModal('publish')">
              <span class="icon-check"></span>{{ $t('actions.action.publish') }}&hellip;
            </button>
            <button id="form-draft-status-abandon-button" type="button"
              class="btn btn-danger" @click="showModal('abandon')">
              <span class="icon-trash"></span>{{ $t('actions.action.abandon') }}&hellip;
            </button>
          </template>
        </page-section>
      </div>
    </div>

    <form-version-view-xml v-bind="viewXml" @hide="hideModal('viewXml')"/>
    <form-new v-bind="upload" @hide="hideModal('upload')"
      @success="afterUpload"/>
    <form-draft-publish v-bind="publish" @hide="hideModal('publish')"
      @success="afterPublish"/>
    <form-draft-abandon v-if="form.dataExists" v-bind="abandon"
      @hide="hideModal('abandon')" @success="afterAbandon"/>
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue';

import FormDraftAbandon from './abandon.vue';
import FormDraftChecklist from './checklist.vue';
import FormDraftPublish from './publish.vue';
import FormNew from '../form/new.vue';
import FormVersionStandardButtons from '../form-version/standard-buttons.vue';
import FormVersionString from '../form-version/string.vue';
import Loading from '../loading.vue';
import PageSection from '../page/section.vue';
import SummaryItem from '../summary-item.vue';
import DatasetSummary from '../dataset/summary.vue';

import modal from '../../mixins/modal';
import routes from '../../mixins/routes';
import { afterNextNavigation } from '../../util/router';
import { apiPaths } from '../../util/request';
import { loadAsync } from '../../util/load-async';
import { noop } from '../../util/util';
import { useRequestData } from '../../request-data';

export default {
  name: 'FormDraftStatus',
  components: {
    FormDraftAbandon,
    FormDraftChecklist,
    FormDraftPublish,
    FormNew,
    FormVersionStandardButtons,
    FormVersionString,
    FormVersionViewXml: defineAsyncComponent(loadAsync('FormVersionViewXml')),
    Loading,
    PageSection,
    SummaryItem,
    DatasetSummary
  },
  mixins: [modal({ viewXml: 'FormVersionViewXml' }), routes()],
  inject: ['alert'],
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
  emits: ['fetch-project', 'fetch-form', 'fetch-draft'],
  setup() {
    const { form, formVersions, formDraft, formDatasetDiff, formDraftDatasetDiff } = useRequestData();
    return { form, formVersions, formDraft, formDatasetDiff, formDraftDatasetDiff };
  },
  data() {
    return {
      // Modals
      viewXml: {
        state: false
      },
      upload: {
        state: false
      },
      publish: {
        state: false
      },
      abandon: {
        state: false
      }
    };
  },
  created() {
    this.fetchData();
  },
  methods: {
    fetchData() {
      this.formVersions.request({
        url: apiPaths.formVersions(this.projectId, this.xmlFormId),
        extended: true,
        resend: false
      })
        .catch(noop);
    },
    afterUpload() {
      this.$emit('fetch-draft');
      this.formDraftDatasetDiff.reset();
      this.hideModal('upload');
      this.alert.success(this.$t('alert.upload'));
    },
    afterPublish() {
      // We need to clear the form before navigating to the form overview: if
      // the form didn't already have a published version, then there would be a
      // validateData violation if we didn't clear it.
      this.$emit('fetch-form');
      this.formDraftDatasetDiff.reset();
      this.formDatasetDiff.reset();
      afterNextNavigation(this.$router, () => {
        // Re-request the project in case its `datasets` property has changed.
        this.$emit('fetch-project', true);
        this.formVersions.data = null;
        this.formDraft.setToNone();
        this.alert.success(this.$t('alert.publish'));
      });
      this.$router.push(this.formPath());
    },
    afterAbandon() {
      this.formDraftDatasetDiff.reset();
      if (this.form.publishedAt != null) {
        afterNextNavigation(this.$router, () => {
          this.formDraft.setToNone();
          this.alert.success(this.$t('alert.abandon'));
        });
        this.$router.push(this.formPath());
      } else {
        const { nameOrId } = this.form;
        afterNextNavigation(this.$router, () => {
          this.alert.success(this.$t('alert.delete', { name: nameOrId }));
        });
        this.$router.push(this.projectPath());
      }
    }
  }
};
</script>

<style lang="scss">
#form-draft-status-standard-buttons-container { margin-bottom: 5px; }
#form-draft-status-publish-button { margin-right: 10px; }
</style>

<i18n lang="json5">
{
  "en": {
    "draftChecklist": {
      // This is a title shown above a section of the page.
      "title": "Draft Checklist"
    },
    "currentDraft": {
      "versionCaption": {
        "full": "{draftVersion} of this Form.",
        "draftVersion": "Draft version"
      },
      "action": {
        "upload": "Upload new definition"
      }
    },
    "actions": {
      // This is a title shown above a section of the page.
      "title": "Actions",
      "action": {
        "publish": "Publish Draft",
        "abandon": "Abandon Draft"
      }
    },
    "alert": {
      "upload": "Success! The new Form definition has been saved as your Draft.",
      "publish": "Your Draft is now published. Any devices retrieving Forms for this Project will now receive the new Form definition and Form Attachments.",
      "abandon": "The Draft version of this Form has been successfully deleted.",
      "delete": "The Form “{name}” was deleted."
    }
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "draftChecklist": {
      "title": "Návrh odškrtávacího seznamu"
    },
    "currentDraft": {
      "versionCaption": {
        "full": "{draftVersion} tohoto formuláře.",
        "draftVersion": "Verze konceptu"
      },
      "action": {
        "upload": "Nahrát novou definici"
      }
    },
    "actions": {
      "title": "Akce",
      "action": {
        "publish": "Publikovat koncept",
        "abandon": "Opustit koncept"
      }
    },
    "alert": {
      "upload": "Bezva! Nová definice formuláře byla uložena jako koncept.",
      "publish": "Váš návrh je nyní zveřejněn. Všechna zařízení, která načítají formuláře pro tento projekt, nyní obdrží novou definici formuláře a přílohy formuláře.",
      "abandon": "Koncept verze tohoto formuláře byl úspěšně odstraněn.",
      "delete": "Formulář „{name}“ byl odstraněn."
    }
  },
  "de": {
    "draftChecklist": {
      "title": "Entwurfscheckliste"
    },
    "currentDraft": {
      "versionCaption": {
        "full": "{draftVersion} von diesem Formular.",
        "draftVersion": "Entwurfsversion"
      },
      "action": {
        "upload": "Neue Definition hochladen"
      }
    },
    "actions": {
      "title": "Aktionen",
      "action": {
        "publish": "Entwurf veröffentlichen",
        "abandon": "Entwurf verwerfen"
      }
    },
    "alert": {
      "upload": "Das neue Formular steht jetzt als Entwurf zur Verfügung.",
      "abandon": "Die Entwurfsversion dieses Formulars wurde gelöscht.",
      "delete": "Das Formular \"{name}\" wurde gelöscht."
    }
  },
  "es": {
    "draftChecklist": {
      "title": "Lista de verificación de borrador"
    },
    "currentDraft": {
      "versionCaption": {
        "full": "{draftVersion} de este formulario.",
        "draftVersion": "Versión preliminar"
      },
      "action": {
        "upload": "Subir nueva definición"
      }
    },
    "actions": {
      "title": "Acciones",
      "action": {
        "publish": "Publicar borrador",
        "abandon": "Abandonar borrador"
      }
    },
    "alert": {
      "upload": "¡Éxito! La nueva definición del formulario se ha guardado como su borrador",
      "abandon": "La versión borrador de este formulario ha sido eliminado con éxito.",
      "delete": "El formulario {name} fue eliminado."
    }
  },
  "fr": {
    "draftChecklist": {
      "title": "Liste de contrôle de l'ébauche"
    },
    "currentDraft": {
      "versionCaption": {
        "full": "{draftVersion} de ce formulaire.",
        "draftVersion": "Version d'ébauche"
      },
      "action": {
        "upload": "Téléverser une nouvelle définition"
      }
    },
    "actions": {
      "title": "Actions",
      "action": {
        "publish": "Publier l'ébauche",
        "abandon": "Abandonner l'ébauche"
      }
    },
    "alert": {
      "upload": "Succès ! La nouvelle définition du formulaire a été enregistrée comme ébauche.",
      "abandon": "La version d'ébauche de ce formulaire a été supprimée avec succès.",
      "delete": "Le formulaire {name} a été supprimé."
    }
  },
  "id": {
    "draftChecklist": {
      "title": "Daftar Periksa Draf"
    },
    "currentDraft": {
      "versionCaption": {
        "full": "{draftVersion} Formulir ini.",
        "draftVersion": "Versi draf"
      },
      "action": {
        "upload": "Unggah definisi baru"
      }
    },
    "actions": {
      "title": "Tindakan",
      "action": {
        "publish": "Terbitkan Draf",
        "abandon": "Buang Draf"
      }
    },
    "alert": {
      "upload": "Sukses! Definisi formulir baru telah disimpan di Draf.",
      "abandon": "Versi draf dari formulir ini telah sukses dihapus.",
      "delete": "Formulir {name} sudah dihapus."
    }
  },
  "it": {
    "draftChecklist": {
      "title": "Lista di controllo bozza"
    },
    "currentDraft": {
      "versionCaption": {
        "full": "{draftVersion} di questo formulario.",
        "draftVersion": "Versione bozza"
      },
      "action": {
        "upload": "Carica la nuova definizione"
      }
    },
    "actions": {
      "title": "Azioni",
      "action": {
        "publish": "Pubblicare la bozza",
        "abandon": "Abbandonare la bozza"
      }
    },
    "alert": {
      "upload": "Successo! La nuova definizione del formulario è stata salvata come bozza.",
      "abandon": "La versione bozza di questo formulario è stata eliminata con successo.",
      "delete": "Il Formulario “{name}” è stato cancellato."
    }
  },
  "ja": {
    "draftChecklist": {
      "title": "下書きのチェックリスト"
    },
    "currentDraft": {
      "versionCaption": {
        "full": "このフォームの{draftVersion}",
        "draftVersion": "下書きバージョン名"
      },
      "action": {
        "upload": "新規定義フォームのアップロード"
      }
    },
    "actions": {
      "title": "操作",
      "action": {
        "publish": "下書きの公開",
        "abandon": "下書きの削除"
      }
    },
    "alert": {
      "upload": "成功です！新しい定義フォームが下書きとして保存されました。",
      "abandon": "このフォームの下書きは正常に削除されました。",
      "delete": "フォーム\"{name}\"は削除されました。"
    }
  },
  "sw": {
    "draftChecklist": {
      "title": "Orodha ya rasimu"
    },
    "currentDraft": {
      "versionCaption": {
        "full": "{draftVersion} ya Fomu hii.",
        "draftVersion": "Toleo la rasimu"
      },
      "action": {
        "upload": "Pakia ufafanuzi mpya"
      }
    },
    "actions": {
      "title": "Vitendo",
      "action": {
        "publish": "Chapisha Rasimu",
        "abandon": "Achana na Rasimu"
      }
    },
    "alert": {
      "upload": "Mafanikio! Ufafanuzi mpya wa Fomu umehifadhiwa kama Rasimu yako",
      "abandon": "Toleo la Rasimu la Fomu hii limefutwa kwa ufanisi.",
      "delete": "Fomu \"{name}\" ilifutwa."
    }
  }
}
</i18n>
