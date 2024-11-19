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
        <page-section>
          <template #heading>
            <span>{{ $t('title') }}</span>
            <enketo-fill v-if="formDraft.dataExists" :form-version="formDraft">
              <span class="icon-plus-circle"></span>{{ $t('action.createSubmission') }}
            </enketo-fill>
          </template>
          <template #body>
            <div v-if="formDraft.entityRelated" class="panel-dialog">
              <div class="panel-heading">
                <span class="panel-title">
                  <span class="icon-database"></span>
                  {{ $t('entitiesTesting.title') }}
                </span>
              </div>
              <div class="panel-body">
                <p>
                  {{ $t('entitiesTesting.body[0]') }}
                </p>
                <p>
                  {{ $t('entitiesTesting.body[1]') }}
                </p>
              </div>
            </div>
            <p>{{ $t('body[0]') }}</p>
            <p>
              <span>{{ $t('body[1]') }}</span>
              <sentence-separator/>
              <i18n-t keypath="moreInfo.helpArticle.full">
                <template #helpArticle>
                  <doc-link to="central-forms/#working-with-form-drafts">{{ $t('moreInfo.helpArticle.helpArticle') }}</doc-link>
                </template>
              </i18n-t>
            </p>
          </template>
        </page-section>
      </div>
      <div class="col-xs-4">
        <float-row>
          <collect-qr v-if="formDraft.dataExists" :settings="qrSettings"
            error-correction-level="Q" :cell-size="3" draft/>
        </float-row>
      </div>
    </div>

    <loading :state="keys.initiallyLoading"/>
    <submission-list v-show="keys.dataExists" :project-id="projectId"
      :xml-form-id="xmlFormId" draft @fetch-keys="fetchData"/>
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
import SentenceSeparator from '../sentence-separator.vue';
import SubmissionList from '../submission/list.vue';
import useSubmissions from '../../request-data/submissions';

import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
import { useRequestData } from '../../request-data';

export default {
  name: 'FormDraftTesting',
  components: {
    PageSection,
    FloatRow,
    CollectQr,
    DocLink,
    EnketoFill,
    Loading,
    SentenceSeparator,
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
  setup() {
    const { resourceView, createResource } = useRequestData();

    // SubmissionList expects submission stores to be created!
    useSubmissions();
    const formDraft = resourceView('formDraft', (data) => data.get());
    const keys = createResource('keys');
    return { formDraft, keys };
  },
  computed: {
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
          name: this.$t('collectProjectName', { name: this.formDraft.nameOrId }),
          icon: '📝'
        },
        // Collect requires the settings to have an `admin` property.
        admin: {}
      };
    }
  },
  created() {
    this.fetchData();
  },
  methods: {
    fetchData() {
      // We do not reconcile this.keys and this.formDraft.keyId.
      this.keys.request({
        url: apiPaths.submissionKeys(this.projectId, this.xmlFormId, true)
      }).catch(noop);
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
    "collectProjectName": "[Draft] {name}",
    // @transifexKey component.FormDraftTesting.datasetsPreview
    "entitiesTesting": {
      "title": "This Form can update Entities",
      "body": [
        "Entities are only updated for published Forms. In a future release of Central, you will be able to test Entity functionality in a Draft state.",
        "For now, we recommend trying your Form definition in Draft state to verify its logic. Before publishing, you can verify that it updates all of the desired properties."
      ]
    }
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
    ],
    "collectProjectName": "[Návrh] {name}",
    "entitiesTesting": {
      "title": "Tento formulář může aktualizovat entity.",
      "body": [
        "Entity jsou aktualizovány pouze pro publikované formuláře. V budoucí verzi Central budete moci testovat funkčnost Entity ve stavu Koncept.",
        "Prozatím doporučujeme vyzkoušet definici formuláře ve stavu Návrh a ověřit její logiku. Před publikováním můžete ověřit, zda aktualizuje všechny požadované vlastnosti."
      ]
    }
  },
  "de": {
    "title": "Entwurfs-Test",
    "body": [
      "Sie können den Konfigurations-Code rechts benutzen, damit Ihr Mobilgerät diesen Entwurf herunterladen kann. Sie können auch die Schaltfläche \"Neu\" oben klicken, um eine neue Übermittlung mit Ihrem Browser zu erstellen.",
      "Entwurfs-Übermittlungen werden in der Testtabelle unten dargestellt. Sie können Sie dort ansehen und herunterladen. Wenn Sie dieses Entwurfsformular veröffentlichen, werden die Test-Übermittlungen irreversibel entfernt."
    ],
    "collectProjectName": "[Entwurf] {name}",
    "entitiesTesting": {
      "title": "Dieses Formular kann Objekte aktualisieren.",
      "body": [
        "Objekte werden nur für veröffentlichte Formulare aktualisiert. In einer zukünftigen Version von Central können Sie die Funktionalität von Objekten im Entwurfsstatus testen.",
        "Derzeit empfehlen wir, Ihre Formdefinition im Entwurfszustand zu überprüfen, um deren Logik zu überprüfen. Bevor Sie sie veröffentlichen, können Sie sicherstellen, dass sie alle gewünschten Eigenschaften aktualisiert."
      ]
    }
  },
  "es": {
    "title": "Prueba de borrador",
    "body": [
      "Puede usar el código de configuración de la derecha para configurar un dispositivo móvil y descargar este borrador. También puede dar clic al botón Nuevo de abajo para crear un nuevo envío desde el navegador web.",
      "El borrador de los envíos van a la tabla de prueba a continuación, donde puede obtener una vista previa y descargar. Cuando publique este borrador de Formulario, sus envíos de prueba se eliminarán permanentemente."
    ],
    "collectProjectName": "borrador {name}",
    "entitiesTesting": {
      "title": "Este Formulario puede actualizar Entidades",
      "body": [
        "Las entidades solo se actualizan para Formularios publicados. En una futura versión de Central, podrás probar la funcionalidad de Entidades en estado de Borrador.",
        "Por ahora, recomendamos probar la definición de su Formulario en estado Borrador para verificar su lógica. Antes de publicar, puede verificar que actualice todas las propiedades deseadas."
      ]
    }
  },
  "fr": {
    "title": "Test de l'ébauche",
    "body": [
      "Vous pouvez utiliser le code de configuration à droite pour configurer un appareil mobile afin de télécharger cette ébauche. Vous pouvez aussi cliquer le bouton Nouveau ci-dessus pour créer une nouvelle soumission depuis votre navigateur.",
      "Les soumissions de test vont dans le tableau ci-dessous où vous pouvez les prévisualiser et télécharger. Quand vous publierez cette ébauche, ses soumissions de test seront définitivement supprimées."
    ],
    "collectProjectName": "[Brouillon] {name}",
    "entitiesTesting": {
      "title": "Ce formulaire peut mettre à jour des Entités.",
      "body": [
        "Les entités ne peuvent être mises à jour qu'avec des formulaires publiés. Dans une future version de Central, vous pourrez tester la mise à jour des entités avec des ébauches de formulaires.",
        "Pour le moment, nous vous conseillons de tester la définition de votre formulaire à l'état d'ébauche pour vérifier sa logique. Avant de le publier, vous pouvez vérifier qu'il met à jour les propriétés désirées."
      ]
    }
  },
  "id": {
    "title": "Pengujian Draf",
    "body": [
      "Anda bisa menggunakan kode konfigurasi di sebelah kanan untuk mengatur perangkat seluler untuk mengunduh draf ini. Anda juga bisa mengklik tombol \"Baru\" untuk membuat kiriman data baru lewat web browser Anda.",
      "Draf kiriman data akan mucnul pada tabel tes di bawah, di mana Anda juga bisa melihat pratinjau dan mengunduhnya. Ketika formulir draf diterbitkan, tes kiriman data akan dihapus secara permanen."
    ],
    "collectProjectName": "[Draf]{name}"
  },
  "it": {
    "title": "Testando la bozza",
    "body": [
      "Puoi utilizzare il codice di configurazione a destra per configurare un dispositivo mobile per scaricare questa bozza. Puoi anche fare clic sul pulsante Nuovo sopra per creare un nuovo invio dal tuo browser web.",
      "Le bozze inviate vanno nella tabella di prova sottostante, dove puoi visualizzarle in anteprima e scaricarle. Quando pubblichi questa bozza di formulario, i suoi Invii di prova verranno rimossi in modo permanente."
    ],
    "collectProjectName": "[Draft] {name}",
    "entitiesTesting": {
      "title": "Questo Formulario può aggiornare Entità",
      "body": [
        "Le entità vengono aggiornate solo per i Moduli pubblicati. In una futura versione di Central, sarà possibile testare la funzionalità delle entità in uno stato di bozza.",
        "Per ora, ti consigliamo di provare la definizione del formulario nello stato Bozza per verificarne la logica. Prima della pubblicazione, puoi verificare che aggiorni tutte le proprietà desiderate."
      ]
    }
  },
  "ja": {
    "title": "下書きのテスト",
    "body": [
      "右の設定コードを利用してモバイル端末に、この下書きフォームをダウンロードする設定ができます。また上の「新規作成」ボタンをクリックすると、Webブラウザからフォームの作成と提出が可能です。",
      "下書きにテスト提出されたフォームは、以下の表に示されます。ここではデータのプレビューやダウンロードが可能です。この下書きフォームを公開した場合、テスト提出済フォームは永久に削除されます。"
    ],
    "collectProjectName": "[下書き] {name}"
  },
  "sw": {
    "title": "Mtihani wa Rasimu",
    "body": [
      "Unaweza kutumia msimbo wa usanidi ulio kulia ili kusanidi kifaa cha mkononi ili kupakua Rasimu hii. Unaweza pia kubofya kitufe kipya hapo juu ili kuunda Wasilisho jipya kutoka kwa kivinjari chako cha wavuti.",
      "Rasimu ya Mawasilisho huenda kwenye jedwali la majaribio hapa chini, ambapo unaweza kuhakiki na kupakua. Unapochapisha Rasimu ya Fomu hii, Mawasilisho yake ya majaribio yataondolewa kabisa."
    ],
    "collectProjectName": "[Rasimu] {name}"
  },
  "zh-Hant": {
    "title": "草稿測試",
    "body": [
      "您可以使用右側的設定代碼設定行動裝置來下載此草稿。您也可以點擊上面的「新增」按鈕，從網頁瀏覽器建立新的提交內容。",
      "草稿提交進入下面的測試表，您可以在其中預覽和下載它們。當您發布此表單草稿時，其測試提交內容將會永久刪除。"
    ],
    "collectProjectName": "[草稿] {name}",
    "entitiesTesting": {
      "title": "該表單可以更新實體",
      "body": [
        "實體僅針對已發布的表單進行更新。在 Central 的未來版本中，您將能夠在草稿狀態下測試實體功能。",
        "目前，我們建議在草稿狀態下嘗試表單定義以驗證其邏輯。在發布之前，您可以驗證它是否更新了所有所需的屬性。"
      ]
    }
  }
}
</i18n>
