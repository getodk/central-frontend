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
          <i18n v-if="rendersAttachmentsWarning" tag="li"
            path="warnings.attachments.full">
            <template #mediaFiles>
              <router-link :to="formPath('draft/attachments')">{{ $t('warnings.attachments.mediaFiles') }}</router-link>
            </template>
          </i18n>
          <i18n v-if="rendersTestingWarning" tag="li"
            path="warnings.testing.full">
            <template #tested>
              <router-link :to="formPath('draft/testing')">{{ $t('warnings.testing.tested') }}</router-link>
            </template>
          </i18n>
        </ul>
      </div>
      <div class="modal-introduction">
        <p>{{ $t('introduction[0]') }}</p>
        <p>{{ $t('introduction[1]') }}</p>
        <p v-if="draftVersionStringIsDuplicate">{{ $t('introduction[2]') }}</p>
      </div>
      <form v-if="draftVersionStringIsDuplicate" @submit.prevent="publish">
        <form-group ref="versionString" v-model.trim="versionString"
          :placeholder="$t('field.version')" required autocomplete="off"/>
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
import { mapGetters } from 'vuex';

import FormGroup from '../form-group.vue';
import Modal from '../modal.vue';
import Spinner from '../spinner.vue';
import request from '../../mixins/request';
import routes from '../../mixins/routes';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
import { requestData } from '../../store/modules/request';

export default {
  name: 'FormDraftPublish',
  components: { FormGroup, Modal, Spinner },
  mixins: [request(), routes()],
  props: {
    state: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      awaitingResponse: false,
      versionString: ''
    };
  },
  computed: {
    // The component does not assume that this data will exist when the
    // component is created.
    ...requestData([
      'formVersions',
      { key: 'formDraft', getOption: true },
      'attachments'
    ]),
    ...mapGetters(['missingAttachmentCount']),
    draftVersionStringIsDuplicate() {
      if (this.formVersions == null || this.formDraft == null) return false;
      return this.formVersions.some(version =>
        version.version === this.formDraft.version);
    },
    rendersAttachmentsWarning() {
      return this.attachments != null && this.missingAttachmentCount !== 0;
    },
    rendersTestingWarning() {
      return this.formDraft != null && this.formDraft.submissions === 0;
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
        )
      })
        .then(() => {
          this.$emit('success');
        })
        .catch(noop);
    }
  }
};
</script>

<i18n lang="json5">
{
  "en": {
    // This is the title at the top of a pop-up.
    "title": "Publish Draft",
    "warnings": {
      "attachments": {
        // This is a warning shown to the user.
        "full": "You have not provided all the {mediaFiles} that your Form requires. You can ignore this if you wish, but you will need to make a new Draft version to upload those files later.",
        "mediaFiles": "Media Files"
      },
      "testing": {
        // This is a warning shown to the user.
        "full": "You have not yet {tested} on a mobile device and uploaded a test Submission. You do not have to do this, but it is highly recommended.",
        "tested": "tested this Form"
      }
    },
    "introduction": [
      "You are about to make this Draft the published version of your Form. This will finalize any changes you have made to the Form definition and its attached Media Files.",
      "Existing Form Submissions will be unaffected, but all Draft test Submissions will be removed.",
      "Every version of a Form requires a unique version name. Right now, your Draft Form has the same version name as a previously published version. You can set a new one by uploading a Form definition with your desired name, or you can type a new one below and the server will change it for you."
    ],
    "field": {
      // This is the text of a form field. It is used to specify a unique
      // version name for the version of the Form that is about to be published.
      "version": "Version"
    },
    "problem": {
      "409_6": "The version name you’ve specified conflicts with a past version of this Form. Please change it to something new and try again."
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
        "full": "Nedodali jste všechny {mediaFiles}, které váš formulář vyžaduje. Můžete to ignorovat, pokud si budete přát, ale budete muset vytvořit novou verzi konceptu, abyste tyto soubory mohli později nahrát.",
        "mediaFiles": "Mediální soubory"
      },
      "testing": {
        "full": "Ještě nemáte {tested} na mobilním zařízení a nahráli jste zkušební příspěvek. Nemusíte to dělat, ale je to velmi doporučeno.",
        "tested": "otestovaný tento formulář"
      }
    },
    "introduction": [
      "Chystáte se tento Koncept vašeho formuláře publikovat. Tím budou dokončeny všechny změny, které jste provedli v definici formuláře a připojených mediálních souborech.",
      "Dosavadní odeslání formulářů nebude ovlivněno, ale všechna rozpracovaná vyplnění formulářů budou odstraněna.",
      "Každá verze formuláře vyžaduje jedinečný název verze. Váš pracovní formulář má nyní stejný název verze jako dříve publikovaná verze. Nový můžete nastavit tak, že nahrajete definici formuláře s požadovaným jménem, nebo můžete napsat nový a server jej za vás změní."
    ],
    "field": {
      "version": "Verze"
    },
    "problem": {
      "409_6": "Název verze, který jste zadali, je v konfliktu s předchozí verzí tohoto formuláře. Změňte prosím na něco nového a zkuste to znovu."
    }
  },
  "de": {
    "title": "Entwurf veröffentlichen",
    "warnings": {
      "attachments": {
        "full": "Sie haben die {mediaFiles} für Ihr Formular benötigten Dateien nicht bereitgestellt. Sie können dies ignorieren, aber Sie müssen Entwurfsversionen zum späteren Hochladen bereitstellen.",
        "mediaFiles": "Mediendateien"
      },
      "testing": {
        "full": "Sie haben {tested} noch nicht auf einem Mobilgerät getestet und eine Test-Datenübermittlung hochgeladen. Sie müssen das nicht tun, aber es wird dringend empfohlen.",
        "tested": "dieses Formular"
      }
    },
    "introduction": [
      "Sie sind dabei, diesen Entwurf in die veröffentlichte Version umzuwandeln. Damit werden alle Änderungen am Formular und den dazugehörenden Mediendateien abgeschlossen.",
      "Bestehende Übermittlungen sind nicht betroffen, aber alle Übermittlungen für den Testentwurf werden entfernt.",
      "Jede Version eines Formulars benötigt einen eindeutigen Versionsnamen. Ihr Entwurfs-Formular hat noch den gleichen Namen wie die vorher veröffentlichte Version. Sie können eine neue Version erstellen, indem Sie den gewünschten Namen eingeben. Wenn Sie keinen neuen Namen eingeben wird der Server die Änderung selbständig vornehmen."
    ],
    "field": {
      "version": "Version"
    },
    "problem": {
      "409_6": "Der Versionsname, den Sie angegeben haben, kollidiert mit einer bestehenden Version des Formulars. Bitte ändern Sie zu einem neuen und versuchen Sie es noch einmal."
    }
  },
  "es": {
    "title": "Publicar borrador",
    "warnings": {
      "attachments": {
        "full": "No ha proporcionado todos los {mediaFiles} que requiere su formulario. Puede ignorar esto si lo desea, pero deberá crear una nueva versión de borrador para cargar esos archivos más tarde.",
        "mediaFiles": "archivos multimedia"
      },
      "testing": {
        "full": "Aún no ha {tested} con un dispositivo móvil y subido un envío de prueba. No tiene que hacer esto, pero es muy recomendable.",
        "tested": "probado este formulario"
      }
    },
    "introduction": [
      "Está a punto de hacer de este borrador la versión publicada de su formulario. Esto finalizará cualquier cambio que haya realizado en la definición del formulario y sus archivos multimedia adjuntos.",
      "Los envíos de formulario existentes no se verán afectados, pero se eliminarán todos los envíos de prueba de borrador.",
      "Cada versión de un formulario requiere un nombre de versión único. En este momento, su borrador de formulario tiene el mismo nombre de versión que una versión publicada anteriormente. Puede establecer una nueva cargando una definición de formulario con su nombre deseado, o puede escribir una nueva a continuación y el servidor la cambiará por usted."
    ],
    "field": {
      "version": "Versión"
    },
    "problem": {
      "409_6": "El nombre de la versión que especificó entra en conflicto con una versión anterior de este formulario. Cambie a algo nuevo e intente nuevamente."
    }
  },
  "fr": {
    "title": "Publier l'ébauche",
    "warnings": {
      "attachments": {
        "full": "Vous n'avez pas fourni tous les {mediaFiles} requis par votre formulaire. Vous pouvez ignorer cette notification, mais vous devrez créer une nouvelle ébauche pour ajouter ces fichiers plus tard.",
        "mediaFiles": "fichiers média"
      },
      "testing": {
        "full": "Vous n'avez pas encore {tested} sur un appareil mobile et téléchargé une soumission de test. Vous n'êtes pas obligé de le faire, mais c'est fortement recommandé.",
        "tested": "testé ce formulaire"
      }
    },
    "introduction": [
      "Vous êtes sur le point de rendre cette ébauche la version publiée de votre formulaire. Cela va finaliser les changements que vous avez apportés à la définition du formulaire et aux fichiers médias qui y sont liés.",
      "Les données existantes pour le formulaire finalisé ne seront pas affectées, mais toutes les données de test de cette ébauche seront supprimées.",
      "Chaque version de formulaire requiert une nom unique. Actuellement, votre ébauche a le même nom de version qu'une version précédemment publiée. Vous pouvez en définir un nouveau en téléversant une définition de formulaire avec le nom désiré, ou vous pouvez en préciser un nouveau ci-dessous et le serveur le changera pour vous."
    ],
    "field": {
      "version": "Version"
    },
    "problem": {
      "409_6": "Le nom de version spécifié est en conflit avec une ancienne version du formulaire. Merci d'en essayer un nouveau et d'essayer à nouveau."
    }
  },
  "id": {
    "title": "Terbitkan Draf",
    "warnings": {
      "attachments": {
        "full": "Anda belum melengkapi {mediaFiles} yang dibutuhkan formulir Anda. Anda dapat mengabaikan ini sekarang, tetapi Anda harus membuat Draf versi baru untuk mengunggah file-file tersebut nanti.",
        "mediaFiles": "File Media"
      },
      "testing": {
        "full": "Anda belum {tested} dan mengunggah tes kiriman data pada perangkat seluler. Hal ini tidak harus, tetapi sangat direkomendasikan.",
        "tested": "mengetes formulir ini"
      }
    },
    "introduction": [
      "Anda hendak menjadikan Draf ini sebagai versi Formulir yang diterbitkan. Ini akan memfinalisasi semua perubahan definisi formulir dan file media yang Anda buat.",
      "Kiriman data formulir yang sudah ada tidak akan terpengaruh, tetapi semua Draf kiriman data akan dihapus.",
      "Setiap versi dari sebuah formulir memerlukan nama yang unik. Saat ini, Draf Formulir Anda memiliki nama yang sama dengan versi yang sudah dipublikasikan sebelumnya. Anda bisa mengatur yang baru dengan mengunggah definisi formulir dengan nama yang Anda kehendaki, atau mengetik nama yang baru di bawah ini dan server akan menggantinya untuk Anda."
    ],
    "field": {
      "version": "Versi"
    },
    "problem": {
      "409_6": "Nama yang Anda pilih sama dengan nama dari versi lama formulir ini. Mohon ubah nama dan coba lagi."
    }
  },
  "it": {
    "title": "Pubblica bozza",
    "warnings": {
      "attachments": {
        "full": "Non hai fornito tutti i {mediaFiles} che il tuo formulario richiede. Puoi ignorarlo se lo desideri, ma dovrai creare una nuova versione bozza per caricare quei file in un secondo momento.",
        "mediaFiles": "File multimediali"
      },
      "testing": {
        "full": "Non hai ancora {tested} su un dispositivo mobile e caricato un invio di prova. Non devi farlo, ma è altamente raccomandato.",
        "tested": "testato questo Formulario"
      }
    },
    "introduction": [
      "Stai per rendere questa bozza la versione pubblicata del tuo formulario. Ciò finalizzerà tutte le modifiche apportate alla definizione del formulario e ai suoi file multimediali allegati.",
      "Gli invii di Formulari esistenti non saranno interessati, ma tutti gli invii di test in bozza verranno rimossi.",
      "Ogni versione di un formulario richiede un nome di versione univoco. In questo momento, la tua bozza di formulario ha lo stesso nome della versione pubblicata in precedenza. Puoi impostarne uno nuovo caricando una definizione del formulario con il nome desiderato, oppure puoi digitarne uno nuovo di seguito e il server lo cambierà per te."
    ],
    "field": {
      "version": "Versione"
    },
    "problem": {
      "409_6": "Il nome della versione che hai specificato è in conflitto con una versione precedente di questo formulario. Per favore sostituiscilo con un altro nome e riprova."
    }
  },
  "ja": {
    "title": "下書きの公開",
    "warnings": {
      "attachments": {
        "full": "フォームに必要な{mediaFiles}がすべて用意されていません。これを無視しても構いませんが、後でそれらのファイルをアップロードするために、新しい下書きバージョンを作成する必要があります。",
        "mediaFiles": "メディアファイル"
      },
      "testing": {
        "full": "まだモバイル端末で{tested}し、フォームのテスト提出がされていません。これは必須ではありませんが、強く推奨します。",
        "tested": "このフォームをテスト"
      }
    },
    "introduction": [
      "この下書きを、公開バージョンにしようとしています。これにより、定義フォームやそれに関連するメディアファイルに加えた変更が確定します。",
      "既存の提出済フォームは影響を受けませんが、全ての下書きへのテスト提出済フォームは削除されます。",
      "フォームの各バージョンには、それぞれ独自のバージョン名が必要です。現在、あなたの下書きフォームには、以前に公開されたバージョンと同じ名前が付けられています。新しいバージョン名を設定するには、希望する名前を付けた定義フォームをアップロードするか、もしくは、以下に新しい名前を入力すれば、サーバーのほうで変更を行います。"
    ],
    "field": {
      "version": "バージョン"
    },
    "problem": {
      "409_6": "指定されたバージョン名は、このフォームの過去のバージョンと競合しています。新しいものに変更して再度試して下さい。"
    }
  }
}
</i18n>
