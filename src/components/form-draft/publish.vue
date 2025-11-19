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
              {{ $t('warnings.attachments.formAttachments') }}
            </template>
          </i18n-t>
          <i18n-t v-if="rendersTestingWarning" tag="li"
            keypath="warnings.testing.full">
            <template #tested>{{ $t('warnings.testing.tested') }}</template>
          </i18n-t>
        </ul>
      </div>
      <div class="modal-introduction">
        <p>{{ $t('introduction[0]') }}</p>
        <p>{{ $t('introduction[1]') }}</p>

        <template v-if="datasetDiff.dataExists && newProperties !== 0">
          <hr>
          <p>{{ $tcn('newProperties', newProperties) }}</p>
        </template>

        <hr v-if="draftVersionStringIsDuplicate">
        <p v-if="draftVersionStringIsDuplicate">{{ $t('introduction[2]') }}</p>

        <p v-if="!draftVersionStringIsDuplicate && !versionConflict">{{ $t('introduction[3]') }}</p>
      </div>
      <form v-if="draftVersionStringIsDuplicate || versionConflict" @submit.prevent="publish">
        <form-group ref="versionString" v-model.trim="versionString"
          :placeholder="$t('common.version')" required autocomplete="off"/>
        <p>{{ $t('introduction[3]') }}</p>
        <!-- We specify two nearly identical .modal-actions, because here we
        want the Proceed button to be a submit button (which means that browsers
        will do some basic form validation when it is clicked). -->
        <div class="modal-actions">
          <button type="button" class="btn btn-link"
            :aria-disabled="awaitingResponse" @click="$emit('hide')">
            {{ $t('action.cancel') }}
          </button>
          <button type="submit" class="btn btn-primary"
            :aria-disabled="awaitingResponse">
            {{ $t('action.proceed') }} <spinner :state="awaitingResponse"/>
          </button>
        </div>
      </form>
      <div v-else class="modal-actions">
        <button type="button" class="btn btn-link" :aria-disabled="awaitingResponse"
          @click="$emit('hide')">
          {{ $t('action.cancel') }}
        </button>
        <button type="button" class="btn btn-primary"
          :aria-disabled="awaitingResponse" @click="publish">
          {{ $t('action.proceed') }} <spinner :state="awaitingResponse"/>
        </button>
      </div>
    </template>
  </modal>
</template>

<script>
import FormGroup from '../form-group.vue';
import Modal from '../modal.vue';
import Spinner from '../spinner.vue';

import useRequest from '../../composables/request';
import { apiPaths, isProblem } from '../../util/request';
import { noop } from '../../util/util';
import { useRequestData } from '../../request-data';

export default {
  name: 'FormDraftPublish',
  components: { FormGroup, Modal, Spinner },
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
    const { formVersions, draftAttachments, formDraftDatasetDiff: datasetDiff, resourceView } = useRequestData();
    const formDraft = resourceView('formDraft', (data) => data.get());

    const { request, awaitingResponse } = useRequest();
    return {
      formVersions, formDraft, draftAttachments, datasetDiff,
      request, awaitingResponse
    };
  },
  data() {
    return {
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
      return this.draftAttachments.dataExists && this.draftAttachments.missingCount !== 0;
    },
    rendersTestingWarning() {
      return this.formDraft.dataExists && this.formDraft.submissions === 0;
    },
    newProperties() {
      return this.datasetDiff.counts.newProperties;
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
    "newProperties": "Publishing this draft will create {count} property. It cannot be deleted. | Publishing this draft will create {count} properties. These cannot be deleted.",
    "problem": {
      "409_6": "The version name of this Draft conflicts with a past version of this Form or a deleted Form. Please use the field below to change it to something new or upload a new Form definition."
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
    "problem": {
      "409_6": "Název verze tohoto návrhu je v rozporu s minulou verzí tohoto formuláře nebo s odstraněným formulářem. Použijte prosím níže uvedené pole a změňte jej na nový nebo nahrajte novou definici Formuláře."
    }
  },
  "de": {
    "title": "Entwurf veröffentlichen",
    "warnings": {
      "attachments": {
        "full": "Sie haben die {formAttachments} für Ihr Formular benötigten Dateien nicht bereitgestellt. Sie können dies ignorieren, aber Sie müssen Entwurfsversionen zum späteren Hochladen bereitstellen.",
        "formAttachments": "Formularanhänge"
      },
      "testing": {
        "full": "Sie haben {tested} noch nicht eine Test-Datenübermittlung hochgeladen. Sie müssen das nicht tun, aber es wird dringend empfohlen.",
        "tested": "dieses Formular"
      }
    },
    "introduction": [
      "Sie sind dabei, diesen Entwurf in die veröffentlichte Version umzuwandeln. Damit werden alle Änderungen am Formular und den dazugehörenden Anhängen abgeschlossen.",
      "Bestehende Übermittlungen sind nicht betroffen, aber alle Übermittlungen für den Testentwurf werden entfernt.",
      "Jede Version eines Formulars benötigt einen eindeutigen Versionsnamen. Ihr Entwurfs-Formular hat noch den gleichen Namen wie die vorher veröffentlichte Version. Sie können eine neue Version erstellen, indem Sie den gewünschten Namen eingeben. Wenn Sie keinen neuen Namen eingeben wird der Server die Änderung selbständig vornehmen.",
      "Möchten Sie fortfahren?"
    ],
    "newProperties": "Die Veröffentlichung dieses Entwurfs wird {count} Eigenschaft erstellen. Sie kann nicht gelöscht werden. | Die Veröffentlichung dieses Entwurfs wird {count} Eigenschaften erstellen. Diese können nicht gelöscht werden.",
    "problem": {
      "409_6": "Der Versionsname dieses Entwurfs steht in Konflikt mit einer früheren Version dieses Formulars oder einem gelöschten Formular. Bitte verwenden Sie das Feld unten, um dies zu ändern oder eine neue Formulardefinition hochzuladen"
    }
  },
  "es": {
    "title": "Publicar borrador",
    "warnings": {
      "attachments": {
        "full": "No ha proporcionado todos los {formAttachments} que requiere su formulario. Puede ignorar esto si lo desea, pero deberá crear una nueva versión de borrador para cargar esos archivos más tarde.",
        "formAttachments": "Archivos adjuntos del formulario"
      },
      "testing": {
        "full": "Aún no ha {tested} subido un envío de prueba. No tiene que hacer esto, pero es muy recomendable.",
        "tested": "probado este formulario"
      }
    },
    "introduction": [
      "Está a punto de hacer de este borrador la versión publicada de su formulario. Esto finalizará cualquier cambio que haya realizado en la definición del formulario y en los archivos adjuntos del formulario.",
      "Los envíos de formulario existentes no se verán afectados, pero se eliminarán todos los envíos de prueba de borrador.",
      "Cada versión de un formulario requiere un nombre de versión único. En este momento, su borrador de formulario tiene el mismo nombre de versión que una versión publicada anteriormente. Puede establecer una nueva cargando una definición de formulario con su nombre deseado, o puede escribir una nueva a continuación y el servidor la cambiará por usted.",
      "¿Le gustaría continuar?"
    ],
    "newProperties": "La publicación de este borrador actualizará {count} propiedad. Esta no se puede eliminar. | La publicación de este borrador actualizará {count} propiedades. Estas no se pueden eliminar. | La publicación de este borrador actualizará {count} propiedades. Estas no se pueden eliminar.",
    "problem": {
      "409_6": "El nombre de la versión de este borrador entra en conflicto con una versión anterior de este formulario o un formulario eliminado. Utilice el campo a continuación para cambiarlo a algo nuevo o cargar una nueva definición de formulario."
    }
  },
  "fr": {
    "title": "Publier l'ébauche",
    "warnings": {
      "attachments": {
        "full": "Vous n'avez pas fourni tous les {formAttachments} requis par votre Formulaire. Vous pouvez ignorer ceci si vous le souhaitez, mais vous devrez créer une nouvelle Ébauche pour fournir ces fichiers plus tard.",
        "formAttachments": "Fichiers joints de formulaire"
      },
      "testing": {
        "full": "Vous n'avez pas encore {tested} en téleversant une soumission. Vous n'êtes pas obligé de faire cela, mais c'est fortement recommandé.",
        "tested": "testé ce formulaire"
      }
    },
    "introduction": [
      "Vous êtes sur le point de faire de cette ébauche la publiée de votre formulaire. Cela va finaliser les changements que vous avez apportés à la définition du formulaire et aux fichiers joints.",
      "Les données existantes pour le formulaire finalisé ne seront pas affectées, mais toutes les données de test de cette ébauche seront supprimées.",
      "Chaque version de formulaire requiert une nom unique. Actuellement, votre ébauche a le même nom de version qu'une version précédemment publiée. Vous pouvez en définir un nouveau en téléversant une définition de formulaire avec le nom désiré, ou vous pouvez en préciser un nouveau ci-dessous et le serveur le changera pour vous.",
      "Voulez vous continuer ?"
    ],
    "newProperties": "Publier cette ébauche créera {count} propriété. Cela ne peut être annulé. | Publier cette ébauche créera {count} propriétés. Cela ne peut être annulé. | Publier cette ébauche créera {count} propriété(s). Cela ne peut être annulé.",
    "problem": {
      "409_6": "Le nom de version de cette ébauche est en conflit avec une version antérieure de ce formulaire ou d’un formulaire supprimé. Merci d'utiliser le champ ci-dessous pour le changer ou téléverser une nouvelle définition de formulaire."
    }
  },
  "id": {
    "title": "Terbitkan Draf"
  },
  "it": {
    "title": "Pubblica bozza",
    "warnings": {
      "attachments": {
        "full": "Non hai fornito tutti i {formAttachments} che il tuo formulario richiede. Puoi ignorarlo se lo desideri, ma dovrai creare una nuova versione bozza per caricare quei file allegati in un secondo momento.",
        "formAttachments": "Allegati del formulario"
      },
      "testing": {
        "full": "Non hai ancora {tested} caricando un invio di prova. Non devi farlo, ma è altamente raccomandato.",
        "tested": "testato questo Formulario"
      }
    },
    "introduction": [
      "Stai per rendere questa bozza la versione pubblicata del tuo formulario. Ciò finalizzerà tutte le modifiche apportate alla definizione del formulario e ai suoi allegati.",
      "Gli invii di Formulari esistenti non saranno interessati, ma tutti gli invii di test in bozza verranno rimossi.",
      "Ogni versione di un formulario richiede un nome di versione univoco. In questo momento, la tua bozza di formulario ha lo stesso nome della versione pubblicata in precedenza. Puoi impostarne uno nuovo caricando una definizione del formulario con il nome desiderato, oppure puoi digitarne uno nuovo di seguito e il server lo cambierà per te.",
      "Vuoi procedere?"
    ],
    "newProperties": "La pubblicazione di questa bozza creerà {count} proprietà. Questa non può essere eliminata. | La pubblicazione di questa bozza creerà {count} proprietà. Queste non possono essere eliminate. | La pubblicazione di questa bozza creerà {count} proprietà. Queste non possono essere eliminate.",
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
    "problem": {
      "409_6": "バージョン名が以前の下書き、または削除されたフォームと競合しています。以下の入力項目から新しいものに変更するか、もしくは新しい定義フォームをアップロードしてください。"
    }
  },
  "pt": {
    "title": "Publicar rascunho",
    "warnings": {
      "attachments": {
        "full": "Você não forneceu todos os {formAttachments} que seu Formulário requer. Você pode ignorar isso se desejar, mas precisará fazer uma nova versão Rascunho para fornecer esses Anexos mais tarde.",
        "formAttachments": "Anexos do Formulário"
      },
      "testing": {
        "full": "Você ainda não {tested} enviando uma resposta de teste. Você não é obrigado a fazê-lo, mas isso é altamente recomendado.",
        "tested": "Testar esse formulário"
      }
    },
    "introduction": [
      "Você está prestes a tornar este Rascunho a versão publicada do seu Formulário. Isso finalizará todas as alterações feitas na definição do Formulário e nos Anexos do Formulário.",
      "As respostas existentes do formulário principal não serão afetadas, mas todas as respostas de teste do rascunho serão removidas.",
      "Cada versão de um formulário requer um nome de versão exclusivo. No momento, seu formulário de rascunho tem o mesmo nome de versão de outro publicado anteriormente. Você pode definir um novo carregando uma definição de formulário com o nome desejado ou pode digitar um novo abaixo e o servidor irá alterá-lo para você.",
      "Você quer prosseguir?"
    ],
    "problem": {
      "409_6": "O nome da versão deste Rascunho está em conflito com uma versão anterior deste Formulário ou de um Formulário excluído. Use o campo abaixo para alterá-lo para algo novo ou carregar uma nova definição do Formulário."
    }
  },
  "sw": {
    "title": "Chapisha Rasimu",
    "warnings": {
      "attachments": {
        "full": "Hujatoa {formAttachments} zote ambazo Fomu yako inahitaji. Unaweza kupuuza hili ukipenda, lakini utahitaji kutengeneza toleo jipya la Rasimu ili kutoa Viambatisho hivyo baadaye.",
        "formAttachments": "Viambatisho vya fomu."
      },
      "testing": {
        "full": "Bado huja {tested} kwa kupakia Wasilisho la jaribio. Sio lazima kufanya hivi, lakini inashauriwa sana.",
        "tested": "Fomu hii imejaribiwa"
      }
    },
    "introduction": [
      "Unakaribia kuifanya Rasimu hii kuwa toleo lililochapishwa la Fomu yako. Hii itakamilisha mabadiliko yoyote uliyofanya kwenye ufafanuzi wa Fomu na Viambatisho vya Fomu.",
      "Mawasilisho ya Fomu Yaliyopo hayataathiriwa, lakini Mawasilisho yote ya Rasimu ya majaribio yataondolewa",
      "Kila toleo la Fomu linahitaji jina la toleo la kipekee. Kwa sasa, Rasimu ya Fomu yako ina jina la toleo sawa na toleo lililochapishwa hapo awali. Unaweza kuweka mpya kwa kupakia ufafanuzi wa Fomu kwa jina unalotaka, au unaweza kuandika mpya hapa chini na seva itakubadilisha.",
      "Je, ungependa kuendelea?"
    ],
    "problem": {
      "409_6": "Jina la toleo la Rasimu hii linakinzana na toleo la awali la Fomu hii au Fomu iliyofutwa. Tafadhali tumia sehemu iliyo hapa chini ili kuibadilisha hadi kitu kipya au kupakia ufafanuzi mpya wa Fomu"
    }
  },
  "zh": {
    "title": "发布草稿",
    "warnings": {
      "attachments": {
        "full": "您尚未提供此表单所需的全部{formAttachments}。若选择忽略，后续需创建新的草稿版本以补充这些附件。",
        "formAttachments": "表单附件"
      },
      "testing": {
        "full": "您尚未通过上传测试提交数据完成{tested}。此操作并非必需，但我们建议您这样做。",
        "tested": "测试此表单"
      }
    },
    "introduction": [
      "您即将将此草稿设置为表单的发布版本。此操作将最终确定您对表单定义及表单附件所做的所有更改。",
      "现有表单提交数据将不受影响，但所有草稿版本的测试提交数据将被清除。",
      "表单的每个版本都必须具有唯一的版本名称。当前您的草稿表单与已发布的某个版本名称重复。您可以通过上传包含新版本名的表单定义来设置，也可以在下框输入新名称，服务器将自动为您更新。",
      "您是否要继续？"
    ],
    "newProperties": "发布此草稿将创建 {count} 个属性，这些属性一经创建即无法删除。",
    "problem": {
      "409_6": "此草稿的版本名称与历史表单版本或已删除表单冲突。请使用下方字段修改为新名称，或上传新的表单定义文件。"
    }
  },
  "zh-Hant": {
    "title": "發布草稿",
    "warnings": {
      "attachments": {
        "full": "您尚未提供表單所需的所有 {formAttachments}。如果您願意，可以忽略此內容，但您需要製作新的草稿版本才能稍後提供這些附件。",
        "formAttachments": "表格附件"
      },
      "testing": {
        "full": "您尚未透過上傳測試提交來{tested}。您不必這樣做，但強烈建議您這樣做。",
        "tested": "測試此表單"
      }
    },
    "introduction": [
      "您即將將此草稿作為您表格的發布版本。這將完成您對表單定義和表單附件所做的任何變更。",
      "現有的表單提交將不受影響，但所有草稿測試提交將被刪除。",
      "表單的每個版本，都需要獨一版本名稱。現在，您的草稿表單與先前發布的版本具有相同的版本名稱。您可以透過上傳具有所需名稱的表單定義來設定新的，也可以在下面輸入一個新的版本名稱，伺服器將為您更改它。",
      "您想繼續嗎？"
    ],
    "newProperties": "發布此草稿將建立{count}種屬性。這些屬性無法刪除。",
    "problem": {
      "409_6": "此草案的版本名稱與此表單的過去版本或已刪除的表單衝突。請使用下面的欄位將其變更為新內容或上傳新的表單定義。"
    }
  }
}
</i18n>
