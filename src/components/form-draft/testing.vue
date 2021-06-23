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
    <div id="form-draft-testing-info" class="row">
      <div class="col-xs-8">
        <page-section condensed>
          <template #heading>
            <span>{{ $t('title') }}</span>
            <enketo-fill v-if="formDraft != null" :form-version="formDraft">
              <span class="icon-plus-circle"></span>{{ $t('action.createSubmission') }}
            </enketo-fill>
          </template>
          <template #body>
            <p>{{ $t('body[0]') }}</p>
            <p>
              {{ $t('body[1]') }}
              <i18n :tag="false" path="moreInfo.helpArticle.full">
                <template #helpArticle>
                  <doc-link to="central-forms/#working-with-form-drafts">{{ $t('moreInfo.helpArticle.helpArticle') }}</doc-link>
                </template>
              </i18n>
            </p>
          </template>
        </page-section>
      </div>
      <div class="col-xs-4">
        <float-row>
          <collect-qr v-if="formDraft != null" :settings="qrSettings"
            error-correction-level="Q" :cell-size="3"/>
        </float-row>
      </div>
    </div>

    <loading :state="$store.getters.initiallyLoading(['keys'])"/>
    <submission-list v-show="keys != null" :project-id="projectId"
      :xml-form-id="xmlFormId" draft/>
  </div>
</template>

<script>
// Import PageSection before FloatRow in order to have the same import order as
// FormSubmissions: see https://github.com/vuejs/vue-cli/issues/3771
import PageSection from '../page/section.vue';
import FloatRow from '../float-row.vue';
import CollectQr from '../collect-qr.vue';
import DocLink from '../doc-link.vue';
import EnketoFill from '../enketo/fill.vue';
import Loading from '../loading.vue';
import SubmissionList from '../submission/list.vue';

import Option from '../../util/option';
import reconcileData from '../../store/modules/request/reconcile';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
import { requestData } from '../../store/modules/request';

export default {
  name: 'FormDraftTesting',
  components: {
    PageSection,
    FloatRow,
    CollectQr,
    DocLink,
    EnketoFill,
    Loading,
    SubmissionList
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
  computed: {
    // The component does not assume that this data will exist when the
    // component is created.
    ...requestData([{ key: 'formDraft', getOption: true }, 'keys']),
    qrSettings() {
      const url = apiPaths.serverUrlForFormDraft(
        this.formDraft.draftToken,
        this.projectId,
        this.xmlFormId
      );
      return {
        general: {
          server_url: `${window.location.origin}${url}`,
          form_update_mode: 'match_exactly',
          autosend: 'wifi_and_cellular'
        },
        project: {
          name: this.$t('collectProjectName', this.formDraft),
          icon: '📝'
        },
        // Collect requires the settings to have an `admin` property.
        admin: {}
      };
    }
  },
  created() {
    this.fetchData();
    this.reconcileSubmissionCount();
  },
  methods: {
    fetchData() {
      this.$store.dispatch('get', [{
        // We do not reconcile `keys` and formDraft.keyId.
        key: 'keys',
        url: apiPaths.submissionKeys(this.projectId, this.xmlFormId, true)
      }]).catch(noop);
    },
    reconcileSubmissionCount() {
      const deactivate = reconcileData.add(
        'formDraft', 'odataChunk',
        (formDraft, odataChunk, commit) => {
          if (formDraft.isDefined() &&
            formDraft.get().submissions !== odataChunk['@odata.count'] &&
            !odataChunk.filtered) {
            commit('setData', {
              key: 'formDraft',
              value: Option.of(formDraft.get().with({
                submissions: odataChunk['@odata.count']
              }))
            });
          }
        }
      );
      this.$once('hook:beforeDestroy', deactivate);
    }
  }
};
</script>

<style lang="scss">
#form-draft-testing-info {
  .page-section, .float-row {
    margin-bottom: 25px;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    // This is a title shown above a section of the page.
    "title": "Draft Testing",
    "body": [
      "You can use the configuration code to the right to set up a mobile device to download this Draft. You can also click the New button above to create a new Submission from your web browser.",
      "Draft Submissions go into the test table below, where you can preview and download them. When you publish this Draft Form, its test Submissions will be permanently removed."
    ],
    // This text will be shown in ODK Collect when testing a Draft Form. {name}
    // is the title of the Draft Form.
    "collectProjectName": "[Draft] {name}"
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "title": "Testování konceptu",
    "body": [
      "Pomocí konfiguračního kódu vpravo můžete nastavit mobilní zařízení ke stažení tohoto konceptu. Můžete také klepnout na tlačítko Nový výše a vytvořit nový příspěvek z webového prohlížeče.",
      "Pro koncept příspěvku přejděte do níže uvedené testovací tabulky, kde si ho můžete prohlédnout a stáhnout. Při publikování tohoto konceptu formuláře budou jeho testovací příspěvky trvale odstraněny."
    ]
  },
  "de": {
    "title": "Entwurfs-Test",
    "body": [
      "Sie können den Konfigurations-Code rechts benutzen, damit Ihr Mobilgerät diesen Entwurf herunterladen kann. Sie können auch die Schaltfläche \"Neu\" oben klicken, um eine neue Übermittlung mit Ihrem Browser zu erstellen.",
      "Entwurfs-Übermittlungen werden in der Testtabelle unten dargestellt. Sie können Sie dort ansehen und herunterladen. Wenn Sie dieses Entwurfsformular veröffentlichen, werden die Test-Übermittlungen irreversibel entfernt."
    ]
  },
  "es": {
    "title": "Prueba de borrador",
    "body": [
      "Puede usar el código de configuración de la derecha para configurar un dispositivo móvil y descargar este borrador. También puede dar clic al botón Nuevo de abajo para crear un nuevo envío desde el navegador web.",
      "El borrador de los envíos van a la tabla de prueba a continuación, donde puede obtener una vista previa y descargar. Cuando publique este borrador de Formulario, sus envíos de prueba se eliminarán permanentemente."
    ]
  },
  "fr": {
    "title": "Test de l'ébauche",
    "body": [
      "Vous pouvez utiliser le code de configuration à droite pour configurer un appareil mobile afin de télécharger cette ébauche. Vous pouvez aussi cliquer le bouton Nouveau ci-dessus pour créer une nouvelle soumission depuis votre navigateur.",
      "Les soumissions de test vont dans le tableau ci-dessous où vous pouvez les prévisualiser et télécharger. Quand vous publierez cette ébauche, ses soumissions de test seront définitivement supprimées."
    ]
  },
  "id": {
    "title": "Pengujian Draf",
    "body": [
      "Anda bisa menggunakan kode konfigurasi di sebelah kanan untuk mengatur perangkat seluler untuk mengunduh draf ini. Anda juga bisa mengklik tombol \"Baru\" untuk membuat kiriman data baru lewat web browser Anda.",
      "Draf kiriman data akan mucnul pada tabel tes di bawah, di mana Anda juga bisa melihat pratinjau dan mengunduhnya. Ketika formulir draf diterbitkan, tes kiriman data akan dihapus secara permanen."
    ]
  }
}
</i18n>
