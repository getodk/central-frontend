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
  <modal id="form-draft-publish" :state="state" :hideable="!awaitingResponse"
    backdrop @shown="focusInput" @hide="$emit('hide')">
    <template #title>{{ $t('title') }}</template>
    <template #body>
      <div v-if="rendersAttachmentsWarning || rendersTestingWarning"
        class="modal-warnings">
        <ul>
          <i18n-t v-if="rendersAttachmentsWarning" tag="li"
            keypath="warnings.attachments.full">
            <template #formAttachments>
              <router-link :to="formPath('draft/attachments')">{{ $t('warnings.attachments.formAttachments') }}</router-link>
            </template>
          </i18n-t>
          <i18n-t v-if="rendersTestingWarning" tag="li"
            keypath="warnings.testing.full">
            <template #tested>
              <router-link :to="formPath('draft/testing')">{{ $t('warnings.testing.tested') }}</router-link>
            </template>
          </i18n-t>
        </ul>
      </div>
      <div class="modal-introduction">
        <p>{{ $t('introduction[0]') }}</p>
        <p>{{ $t('introduction[1]') }}</p>

        <template v-if="formDraft.entityRelated && hasDatasetDiff">
          <hr>
          <i18n-t tag="p" keypath="dataset.introduction.full">
            <template #inAddition>
              <strong>{{ $t('dataset.introduction.inAddition') }}</strong>
            </template>
          </i18n-t>
          <ul class="dataset-list">
            <template v-for="dataset of formDraftDatasetDiff" :key="dataset.name">
              <i18n-t v-if="dataset.isNew" tag="li" keypath="dataset.newDataset">
                <template #datasetName>
                  <strong>{{ dataset.name }}</strong>
                </template>
              </i18n-t>
              <template v-for="property of dataset.properties" :key="property.name">
                <i18n-t v-if="property.isNew && property.inForm" tag="li" keypath="dataset.newProperty">
                  <template #datasetName>
                    <strong>{{ dataset.name }}</strong>
                  </template>
                  <template #propertyName>
                    <strong>{{ property.name }}</strong>
                  </template>
                </i18n-t>
              </template>
            </template>
          </ul>
        </template>

        <hr v-if="draftVersionStringIsDuplicate">
        <p v-if="draftVersionStringIsDuplicate">{{ $t('introduction[2]') }}</p>

        <p v-if="!draftVersionStringIsDuplicate && !versionConflict">{{ $t('introduction[3]') }}</p>
      </div>
      <form v-if="draftVersionStringIsDuplicate || versionConflict" @submit.prevent="publish">
        <form-group ref="versionString" v-model.trim="versionString"
          :placeholder="$t('field.version')" required autocomplete="off"/>
        <p>{{ $t('introduction[3]') }}</p>
        <!-- We specify two nearly identical .modal-actions, because here we
        want the Proceed button to be a submit button (which means that browsers
        will do some basic form validation when it is clicked). -->
        <div class="modal-actions">
          <button type="submit" class="btn btn-primary"
            :disabled="awaitingResponse">
            {{ $t('action.proceed') }} <spinner :state="awaitingResponse"/>
          </button>
          <button type="button" class="btn btn-link"
            :disabled="awaitingResponse" @click="$emit('hide')">
            {{ $t('action.cancel') }}
          </button>
        </div>
      </form>
      <div v-else class="modal-actions">
        <button type="button" class="btn btn-primary"
          :disabled="awaitingResponse" @click="publish">
          {{ $t('action.proceed') }} <spinner :state="awaitingResponse"/>
        </button>
        <button type="button" class="btn btn-link" :disabled="awaitingResponse"
          @click="$emit('hide')">
          {{ $t('action.cancel') }}
        </button>
      </div>
    </template>
  </modal>
</template>

<script>
import { any } from 'ramda';
import FormGroup from '../form-group.vue';
import Modal from '../modal.vue';
import Spinner from '../spinner.vue';

import request from '../../mixins/request';
import routes from '../../mixins/routes';
import { apiPaths, isProblem } from '../../util/request';
import { noop } from '../../util/util';
import { useRequestData } from '../../request-data';

export default {
  name: 'FormDraftPublish',
  components: { FormGroup, Modal, Spinner },
  mixins: [request(), routes()],
  inject: ['alert'],
  props: {
    state: {
      type: Boolean,
      default: false
    }
  },
  emits: ['hide', 'success'],
  setup() {
    // The component does not assume that this data will exist when the
    // component is created.
    const { formVersions, attachments, resourceView, formDraftDatasetDiff } = useRequestData();
    const formDraft = resourceView('formDraft', (data) => data.get());
    return { formVersions, formDraft, attachments, formDraftDatasetDiff };
  },
  data() {
    return {
      awaitingResponse: false,
      versionString: '',
      // versionConflict is used in a scenario where a user tries to
      // publish a form that conflicts with a form/version combo probably
      // found in the trash. This component doesn't have access to trashed
      // forms so it doesn't know about the conflict until the request from
      // the backend returns the problem. Setting versionConflict = true
      // unhides the version input field so the user can correct the conflict.
      versionConflict: false
    };
  },
  computed: {
    draftVersionStringIsDuplicate() {
      if (!(this.formVersions.dataExists && this.formDraft.dataExists))
        return false;
      return this.formVersions.some(version =>
        version.version === this.formDraft.version);
    },
    rendersAttachmentsWarning() {
      return this.attachments.dataExists && this.attachments.missingCount !== 0;
    },
    rendersTestingWarning() {
      return this.formDraft.dataExists && this.formDraft.submissions === 0;
    },
    hasDatasetDiff() {
      return this.formDraftDatasetDiff.dataExists &&
        any(d => d.isNew || any(p => p.isNew && p.inForm, d.properties), this.formDraftDatasetDiff.data);
    }
  },
  watch: {
    state(state) {
      if (state) this.versionString = this.formDraft.version;
    }
  },
  methods: {
    focusInput() {
      if (this.draftVersionStringIsDuplicate) this.$refs.versionString.focus();
    },
    publish() {
      this.request({
        method: 'POST',
        url: apiPaths.publishFormDraft(
          this.formDraft.projectId,
          this.formDraft.xmlFormId,
          this.versionString !== this.formDraft.version
            ? { version: this.versionString }
            : null
        ),
        fulfillProblem: (problem) => problem.code === 409.6
      })
        .then(({ data }) => {
          if (!isProblem(data)) {
            this.$emit('success');
          } else {
            this.alert.danger(this.$t('problem.409_6'));
            this.versionConflict = true;
          }
        })
        .catch(noop);
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';
@import '../../assets/css/icomoon';

.dataset-list {
  list-style: none;
  padding-left: 5px;

  li {
    hyphens: auto;
    overflow-wrap: break-word;
  }

  li::before {
    @extend [class^="icon-"];
    content: '\f055';
    margin-right:5px;
    color: green;
  }
}

.field-list{
  list-style: none;

  li::before {
    @extend [class^="icon-"];
    content: '\f055';
  }
}

</style>

<i18n lang="json5">
{
  "en": {
    // This is the title at the top of a pop-up.
    "title": "Publish Draft",
    "warnings": {
      "attachments": {
        // This is a warning shown to the user.
        "full": "You have not provided all the {formAttachments} that your Form requires. You can ignore this if you wish, but you will need to make a new Draft version to provide those Attachments later.",
        "formAttachments": "Form Attachments"
      },
      "testing": {
        // This is a warning shown to the user.
        "full": "You have not yet {tested} by uploading a test Submission. You do not have to do this, but it is highly recommended.",
        "tested": "tested this Form"
      }
    },
    "introduction": [
      "You are about to make this Draft the published version of your Form. This will finalize any changes you have made to the Form definition and Form Attachments.",
      "Existing Form Submissions will be unaffected, but all Draft test Submissions will be removed.",
      "Every version of a Form requires a unique version name. Right now, your Draft Form has the same version name as a previously published version. You can set a new one by uploading a Form definition with your desired name, or you can type a new one below and the server will change it for you.",
      "Would you like to proceed?"
    ],
    "field": {
      // This is the text of a form field. It is used to specify a unique
      // version name for the version of the Form that is about to be published.
      "version": "Version"
    },
    "problem": {
      "409_6": "The version name of this Draft conflicts with a past version of this Form or a deleted Form. Please use the field below to change it to something new or upload a new Form definition."
    },
    "dataset": {
      "introduction": {
        "full": "{inAddition} publishing this Form definition will make the following changes to this Project:",
        "inAddition": "In addition,"
      },
      "newDataset": "A new Dataset {datasetName} will be created.",
      "newProperty": "In Dataset {datasetName}, a new property {propertyName} will be created."
    }
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "title": "Publikovat koncept",
    "warnings": {
      "attachments": {
        "full": "Neposkytli jste všechny {formAttachments}, které váš formulář vyžaduje. Pokud chcete, můžete to ignorovat, ale později budete muset vytvořit novou verzi návrhu a tyto přílohy poskytnout.",
        "formAttachments": "Přílohy formuláře"
      },
      "testing": {
        "full": "Ještě jste nenahráli {tested} nahráním testovacího podání. Nemusíte to dělat, ale důrazně to doporučujeme.",
        "tested": "otestovaný tento formulář"
      }
    },
    "introduction": [
      "Tento návrh se chystáte učinit zveřejněnou verzí svého formuláře. Tím dokončíte všechny změny, které jste provedli v definici formuláře a v přílohách formuláře.",
      "Dosavadní odeslání formulářů nebude ovlivněno, ale všechna rozpracovaná vyplnění formulářů budou odstraněna.",
      "Každá verze formuláře vyžaduje jedinečný název verze. Váš pracovní formulář má nyní stejný název verze jako dříve publikovaná verze. Nový můžete nastavit tak, že nahrajete definici formuláře s požadovaným jménem, nebo můžete napsat nový a server jej za vás změní.",
      "Chcete pokračovat?"
    ],
    "field": {
      "version": "Verze"
    },
    "problem": {
      "409_6": "Název verze tohoto návrhu je v rozporu s minulou verzí tohoto formuláře nebo s odstraněným formulářem. Použijte prosím níže uvedené pole a změňte jej na nový nebo nahrajte novou definici Formuláře."
    }
  },
  "de": {
    "title": "Entwurf veröffentlichen",
    "warnings": {
      "testing": {
        "full": "Sie haben {tested} noch nicht eine Test-Datenübermittlung hochgeladen. Sie müssen das nicht tun, aber es wird dringend empfohlen.",
        "tested": "dieses Formular"
      }
    },
    "field": {
      "version": "Version"
    },
    "problem": {
      "409_6": "Der Versionsname dieses Entwurfs steht in Konflikt mit einer früheren Version dieses Formulars oder einem gelöschten Formular. Bitte verwenden Sie das Feld unten, um dies zu ändern oder eine neue Formulardefinition hochzuladen"
    }
  },
  "es": {
    "title": "Publicar borrador",
    "warnings": {
      "testing": {
        "full": "Aún no ha {tested} subido un envío de prueba. No tiene que hacer esto, pero es muy recomendable.",
        "tested": "probado este formulario"
      }
    },
    "field": {
      "version": "Versión"
    },
    "problem": {
      "409_6": "El nombre de la versión de este borrador entra en conflicto con una versión anterior de este formulario o un formulario eliminado. Utilice el campo a continuación para cambiarlo a algo nuevo o cargar una nueva definición de formulario."
    }
  },
  "fr": {
    "title": "Publier l'ébauche",
    "warnings": {
      "testing": {
        "full": "Vous n'avez pas encore {tested} en téleversant une soumission. Vous n'êtes pas obligé de faire cela, mais c'est fortement recommandé.",
        "tested": "testé ce formulaire"
      }
    },
    "field": {
      "version": "Version"
    },
    "problem": {
      "409_6": "Le nom de version de cette ébauche est en conflit avec une version antérieure de ce formulaire ou d’un formulaire supprimé. Merci d'utiliser le champ ci-dessous pour le changer ou téléverser une nouvelle définition de formulaire."
    },
    "dataset": {
      "newDataset": "Un nouveau Dataset {datasetName} va être créé."
    }
  },
  "id": {
    "title": "Terbitkan Draf",
    "field": {
      "version": "Versi"
    }
  },
  "it": {
    "title": "Pubblica bozza",
    "warnings": {
      "testing": {
        "full": "Non hai ancora {tested} caricando un invio di prova. Non devi farlo, ma è altamente raccomandato.",
        "tested": "testato questo Formulario"
      }
    },
    "field": {
      "version": "Versione"
    },
    "problem": {
      "409_6": "Il nome della versione di questa bozza è in conflitto con una versione precedente di questo formulario o con un formulario eliminato. Utilizza il campo sottostante per cambiarlo in qualcosa di nuovo o caricare una nuova definizione del formulario."
    }
  },
  "ja": {
    "title": "下書きの公開",
    "warnings": {
      "testing": {
        "full": "まだテストフォームのアップロードにより、{tested}していません。これは必須ではありませんが、強く推奨します。",
        "tested": "このフォームをテスト"
      }
    },
    "field": {
      "version": "バージョン"
    },
    "problem": {
      "409_6": "バージョン名が以前の下書き、または削除されたフォームと競合しています。以下の入力項目から新しいものに変更するか、もしくは新しい定義フォームをアップロードしてください。"
    }
  },
  "sw": {
    "title": "Chapisha Rasimu",
    "warnings": {
      "testing": {
        "full": "Bado huja {tested} kwa kupakia Wasilisho la jaribio. Sio lazima kufanya hivi, lakini inashauriwa sana.",
        "tested": "Fomu hii imejaribiwa"
      }
    },
    "field": {
      "version": "Toleo"
    },
    "problem": {
      "409_6": "Jina la toleo la Rasimu hii linakinzana na toleo la awali la Fomu hii au Fomu iliyofutwa. Tafadhali tumia sehemu iliyo hapa chini ili kuibadilisha hadi kitu kipya au kupakia ufafanuzi mpya wa Fomu"
    }
  }
}
</i18n>
