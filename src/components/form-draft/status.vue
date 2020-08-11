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
    <loading :state="$store.getters.initiallyLoading(['formVersions'])"/>
    <div v-show="formVersions != null" class="row">
      <div class="col-xs-6">
        <page-section condensed>
          <template #heading>
            <span>{{ $t('draftChecklist.title') }}</span>
          </template>
          <template #body>
            <form-draft-checklist status/>
          </template>
        </page-section>
      </div>
      <div class="col-xs-6">
        <page-section condensed>
          <template #heading>
            <span>{{ $t('common.currentDraft') }}</span>
          </template>
          <template #body>
            <form-version-summary-item v-if="formDraft != null"
              :version="formDraft">
              <template #body>
                <i18n tag="p" path="currentDraft.versionCaption.full">
                  <template #draftVersion>
                    <strong>{{ $t('currentDraft.versionCaption.draftVersion') }}</strong>
                  </template>
                </i18n>
                <button id="form-draft-status-upload-button" type="button"
                  class="btn btn-primary" @click="showModal('upload')">
                  <span class="icon-upload"></span>{{ $t('currentDraft.action.upload') }}&hellip;
                </button>
              </template>
            </form-version-summary-item>
          </template>
        </page-section>
        <page-section condensed>
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

    <form-new v-bind="upload" @hide="hideModal('upload')"
      @success="afterUpload"/>
    <form-draft-publish v-bind="publish" @hide="hideModal('publish')"
      @success="afterPublish"/>
    <form-draft-abandon v-if="form != null" v-bind="abandon"
      @hide="hideModal('abandon')" @success="afterAbandon"/>
  </div>
</template>

<script>
import FormDraftAbandon from './abandon.vue';
import FormDraftChecklist from './checklist.vue';
import FormDraftPublish from './publish.vue';
import FormNew from '../form/new.vue';
import FormVersionSummaryItem from '../form-version/summary-item.vue';
import Loading from '../loading.vue';
import Option from '../../util/option';
import PageSection from '../page/section.vue';
import modal from '../../mixins/modal';
import routes from '../../mixins/routes';
import validateData from '../../mixins/validate-data';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
import { requestData } from '../../store/modules/request';

export default {
  name: 'FormDraftStatus',
  components: {
    FormDraftAbandon,
    FormDraftChecklist,
    FormDraftPublish,
    FormNew,
    FormVersionSummaryItem,
    Loading,
    PageSection
  },
  mixins: [modal(), routes(), validateData()],
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
  // The component does not assume that this data will exist when the component
  // is created.
  computed: requestData([
    'form',
    'formVersions',
    { key: 'formDraft', getOption: true }
  ]),
  created() {
    this.fetchData();
  },
  methods: {
    fetchData() {
      this.$store.dispatch('get', [{
        key: 'formVersions',
        url: apiPaths.formVersions(this.projectId, this.xmlFormId),
        extended: true,
        resend: false
      }]).catch(noop);
    },
    afterUpload() {
      this.$emit('fetch-draft');
      this.hideModal('upload');
      this.$alert().success(this.$t('alert.upload'));
    },
    clearDraft() {
      this.$store.commit('setData', {
        key: 'formDraft',
        value: Option.none()
      });
      this.$store.commit('setData', {
        key: 'attachments',
        value: Option.none()
      });
    },
    afterPublish() {
      this.$emit('fetch-form');
      this.$store.commit('clearData', 'formVersions');
      this.clearDraft();
      this.$router.push(this.formPath(), () => {
        this.$alert().success(this.$t('alert.publish'));
      });
    },
    afterAbandon(form) {
      if (form.publishedAt != null) {
        this.clearDraft();
        this.$router.push(this.formPath(), () => {
          this.$alert().success(this.$t('alert.abandon'));
        });
      } else {
        this.$router.push(this.projectPath(), () => {
          this.$alert().success(this.$t('alert.delete', {
            name: form.nameOrId()
          }));
        });
      }
    }
  }
};
</script>

<style lang="scss">
#form-draft-status-publish-button {
  margin-right: 10px;
}
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
      "publish": "Your Draft is now published. Any devices retrieving Forms for this Project will now receive the new Form definition and Media Files.",
      "abandon": "The Draft version of this Form has been successfully deleted.",
      "delete": "The Form “{name}” was deleted."
    }
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "es": {
    "draftChecklist": {
      "title": "Lista de verificación de Borrador"
    },
    "currentDraft": {
      "versionCaption": {
        "full": "{draftVersion}de este Formulario.",
        "draftVersion": "Versión preliminar"
      },
      "action": {
        "upload": "Subir nueva definición"
      }
    },
    "actions": {
      "title": "Acciones",
      "action": {
        "publish": "Publicar Borrador",
        "abandon": "Abandonar borrador."
      }
    },
    "alert": {
      "upload": "¡Éxito! La nueva definición del Formulario se ha guardado como su borrador",
      "publish": "Su borrador ya está publicado. Cualquier dispositivo que recupere formularios para este proyecto ahora recibirá la nueva definición de Formulario y archivos multimedia",
      "abandon": "La versión Borrador de este Formulario ha sido eliminado con éxito.",
      "delete": "El Formulario {name}fue eliminado."
    }
  }
}
</i18n>
