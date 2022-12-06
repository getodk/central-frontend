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
  <div v-if="dataExists">
    <checklist-step v-if="form.publishedAt == null" stage="complete">
      <template #title>{{ $t('steps[0].title') }}</template>
      <p>
        <strong>{{ $t('steps[0].body[0]') }}</strong>
        <sentence-separator/>
        <span>{{ $t('steps[0].body[1]') }}</span>
      </p>
    </checklist-step>
    <checklist-step stage="current">
      <template #title>{{ $t('steps[1].title') }}</template>
      <p v-if="status">
        {{ $t('steps[1].body[0].status') }}
      </p>
      <i18n-t v-else tag="p" keypath="steps[1].body[0].link.full">
        <template #upload>
          <router-link :to="formPath('draft')">{{ $t('steps[1].body[0].link.upload') }}</router-link>
        </template>
      </i18n-t>
    </checklist-step>
    <checklist-step v-if="attachments.get().size !== 0"
      :stage="attachments.missingCount === 0 ? 'complete' : 'current'">
      <template #title>{{ $t('steps[2].title') }}</template>
      <p>
        <i18n-t keypath="steps[2].body[0].full">
          <template #formAttachments>
            <router-link :to="formPath('draft/attachments')">{{ $t('steps[2].body[0].formAttachments') }}</router-link>
          </template>
        </i18n-t>
        <sentence-separator/>
        <doc-link to="central-forms/#forms-with-attachments">{{ $t('clickForInfo') }}</doc-link>
      </p>
    </checklist-step>
    <checklist-step
      :stage="formDraft.submissions !== 0 ? 'complete' : 'current'">
      <template #title>{{ $t('steps[3].title') }}</template>
      <p>
        <i18n-t keypath="steps[3].body[0].full">
          <template #test>
            <router-link :to="formPath('draft/testing')">{{ $t('steps[3].body[0].test') }}</router-link>
          </template>
        </i18n-t>
        <sentence-separator/>
        <doc-link to="central-forms/#working-with-form-drafts">{{ $t('clickForInfo') }}</doc-link>
      </p>
    </checklist-step>
    <checklist-step stage="current">
      <template #title>{{ $t('steps[4].title') }}</template>
      <p>
        <template v-if="status">{{ $t('steps[4].body[0].status') }}</template>
        <i18n-t v-else keypath="steps[4].body[0].link.full">
          <template #publish>
            <router-link :to="formPath('draft')">{{ $t('steps[4].body[0].link.publish') }}</router-link>
          </template>
        </i18n-t>
        <sentence-separator/>
        <doc-link to="central-forms/#working-with-form-drafts">{{ $t('clickForInfo') }}</doc-link>
      </p>
    </checklist-step>
  </div>
</template>

<script>
import ChecklistStep from '../checklist-step.vue';
import DocLink from '../doc-link.vue';
import SentenceSeparator from '../sentence-separator.vue';

import routes from '../../mixins/routes';
import { useRequestData } from '../../request-data';

export default {
  name: 'FormDraftChecklist',
  components: { ChecklistStep, DocLink, SentenceSeparator },
  mixins: [routes()],
  props: {
    // Indicates whether the current route path is .../draft.
    status: {
      type: Boolean,
      default: false
    }
  },
  setup() {
    // The component does not assume that this data will exist when the
    // component is created.
    const { form, attachments, resourceView, resourceStates } = useRequestData();
    const formDraft = resourceView('formDraft', (data) => data.get());
    const { dataExists } = resourceStates([form, formDraft, attachments]);
    return { form, formDraft, attachments, dataExists };
  }
};
</script>

<i18n lang="json5">
{
  "en": {
    "clickForInfo": "Click here to find out more.",
    "steps": [
      {
        // This is the title of a checklist item.
        "title": "Upload initial Form definition",
        "body": [
          "Great work!",
          "Your Form design has been loaded successfully."
        ]
      },
      {
        // This is the title of a checklist item.
        "title": "Upload revised Form definition (optional)",
        "body": [
          {
            // This refers to changes to the Form definition as opposed to just
            // the Attachments associated with the Form. The word "XLSForm" should not
            // be translated.
            "status": "If you have made changes to the Form itself, including question text or logic rules, now is the time to upload the new XML or XLSForm using the button to the right.",
            "link": {
              // This refers to changes to the Form definition as opposed to
              // just the Attachments associated with the Form. The word "XLSForm"
              // should not be translated.
              "full": "If you have made changes to the Form itself, including question text or logic rules, now is the time to {upload} the new XML or XLSForm.",
              "upload": "upload"
            }
          }
        ]
      },
      {
        // This is the title of a checklist item.
        "title": "Upload Form Attachments",
        "body": [
          {
            "full": "Your Form design references files that are needed in order to present your Form. You can upload new or updated copies of these for distribution under the {formAttachments} tab.",
            "formAttachments": "Form Attachments"
          }
        ]
      },
      {
        // This is the title of a checklist item.
        "title": "Test the Form by creating a Submission",
        "body": [
          {
            "full": "You can {test} a Form to be sure it works the way you expect. Test Submissions are not included in your final data.",
            "test": "test"
          }
        ]
      },
      {
        // This is the title of a checklist item.
        "title": "Publish the Draft",
        "body": [
          {
            "status": "When you are sure your Draft is ready and you wish to roll it out to your devices in the field, you can publish it using the button to the right.",
            "link": {
              "full": "When you are sure your Draft is ready and you wish to roll it out to your devices in the field, you can {publish} it.",
              "publish": "publish"
            }
          }
        ]
      }
    ]
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "clickForInfo": "Klikněte sem a dozvíte se více",
    "steps": [
      {
        "title": "Nahrajte počáteční definici formuláře",
        "body": [
          "Skvělá práce!",
          "Návrh formuláře byl úspěšně načten."
        ]
      },
      {
        "title": "Nahrát revidovanou definici formuláře (volitelné)",
        "body": [
          {
            "status": "Pokud jste provedli změny v samotném formuláři, včetně textu otázek nebo logických pravidel, je nyní čas nahrát nový XML nebo XLSForm pomocí tlačítka napravo.",
            "link": {
              "full": "Pokud jste provedli změny v samotném formuláři, včetně textu otázek nebo logických pravidel, je nyní čas na {upload} nového XML nebo XLSForm.",
              "upload": "nahrát"
            }
          }
        ]
      },
      {
        "title": "Nahrát přílohy formuláře"
      },
      {
        "title": "Otestujte formulář vytvořením podání",
        "body": [
          {
            "full": "Můžete {test} formulář abyste se ujistili, že funguje tak, jak očekáváte. Testovací odeslání nejsou součástí vašich konečných údajů.",
            "test": "otestovat"
          }
        ]
      },
      {
        "title": "Publikovat koncept",
        "body": [
          {
            "status": "Pokud jste si jisti, že je koncept připraven a chcete jej uvést do provozu v terénu, můžete jej publikovat pomocí tlačítka napravo.",
            "link": {
              "full": "Pokud jste si jisti, že je koncept připraven a chcete jej uvést do provozu v terénu, můžete ho {publish}.",
              "publish": "publikovat"
            }
          }
        ]
      }
    ]
  },
  "de": {
    "clickForInfo": "Klicken Sie hier, um mehr zu erfahren.",
    "steps": [
      {
        "title": "Formulardefinition hochladen",
        "body": [
          "Gute Arbeit!",
          "Ihr Formular wurde erfolgreich hochgeladen."
        ]
      },
      {
        "title": "Geändert Formulardefinition hochladen (optional)",
        "body": [
          {
            "status": "Wenn Sie Änderungen am Formular selbst vorgenommen haben, etwa am Fragetext oder an den Logikregeln, sollten Sie jetzt das neue XML- oder XLSFormular mit der Schaltfläche auf der rechten Seite hochladen.",
            "link": {
              "full": "Wenn Sie Änderungen am Formular selbst vorgenommen haben, etwa am Fragetext oder an den Logikregeln, sollten Sie jetzt das neue Formular {upload}.",
              "upload": "hochladen"
            }
          }
        ]
      },
      {},
      {
        "title": "Teste das Formular indem du eine Einreichung erstellst.",
        "body": [
          {
            "full": "Sie können ein Formular {test}, um sicher zu sein, dass es wie erwartet funktioniert. Test-Übermittlungen sind in den endgültigen Daten nicht enthalten.",
            "test": "testen"
          }
        ]
      },
      {
        "title": "Den Entwurf veröffentlichen",
        "body": [
          {
            "status": "Wenn Sie sicher sind, dass Ihr Entwurf fertig ist und Sie ihn für den Feldeinsatz bereitstellen wollen, können Sie ihn mit der Schaltfläche rechts veröffentlichen.",
            "link": {
              "full": "Wenn Sie sicher sind, dass Ihr Entwurf fertig ist und Sie ihn für den Feldeinsatz bereitstellen wollen, können sie ihn {publish}.",
              "publish": "veröffentlichen"
            }
          }
        ]
      }
    ]
  },
  "es": {
    "clickForInfo": "Haga clic aquí para descubrir más.",
    "steps": [
      {
        "title": "Subir definición de formulario inicial",
        "body": [
          "Buen trabajo.",
          "Su diseño de formulario se ha cargado correctamente."
        ]
      },
      {
        "title": "Subir definición de formulario revisada (opcional)",
        "body": [
          {
            "status": "Si ha realizado cambios en el formulario en sí, incluido el texto de la pregunta o las reglas lógicas, ahora es el momento de cargar el nuevo XML o XLSForm utilizando el botón a la derecha.",
            "link": {
              "full": "Si ha realizado cambios en el formulario en sí, incluido el texto de la pregunta o las reglas lógicas, ahora es el momento de {upload} el nuevo XML o XLSForm.",
              "upload": "subir"
            }
          }
        ]
      },
      {},
      {
        "title": "Pruebe el formulario creando un envío",
        "body": [
          {
            "full": "Puede {test} un formulario para asegurarse de que funciona como usted espera. Los envíos de prueba no son incluidos en sus datos finales.",
            "test": "probar"
          }
        ]
      },
      {
        "title": "Publicar el borrador",
        "body": [
          {
            "status": "Cuando esté seguro de que su borrador está listo y desea extenderlo a sus dispositivos en el campo, puede publicarlo usando el botón a la derecha.",
            "link": {
              "full": "Cuando esté seguro de que su borrador está listo y desea extenderlo a sus dispositivos en el campo, puede {publish}.",
              "publish": "publicarlo"
            }
          }
        ]
      }
    ]
  },
  "fr": {
    "clickForInfo": "Cliquez ici pour en savoir plus.",
    "steps": [
      {
        "title": "Téléverser la définition initiale du formulaire",
        "body": [
          "Beau travail !",
          "Votre design de formulaire a été téléversé avec succès."
        ]
      },
      {
        "title": "Téléverser une révision de la définition du formulaire (optionnel)",
        "body": [
          {
            "status": "Si vous avez apporté des changements au formulaire lui-même, y compris au texte des questions ou au règles logiques, il est temps de téléverser le nouveau XML ou XLSForm en utilisant le bouton de droite.",
            "link": {
              "full": "Si vous avez apporté des changements au formulaire lui-même, y compris au texte des questions ou au règles logiques, il est temps de {upload} le nouveau XML ou XLSForm.",
              "upload": "téléverser"
            }
          }
        ]
      },
      {
        "title": "Envoyer les fichiers joints du formulaire",
        "body": [
          {
            "full": "Votre définition de formulaire référence des fichiers nécessaires à la présentation de votre formulaire. Vous pouvez envoyer des copies nouvelles ou mises à jour de ces fichiers sous l'onglet {formAttachments}.",
            "formAttachments": "Fichiers joints de formulaire"
          }
        ]
      },
      {
        "title": "Testez le formulaire en créant une soumission",
        "body": [
          {
            "full": "Vous pouvez {test} un formulaire pour vérifier qu'il fonctionne comme prévu. Les soumissions de test ne seront pas incluses dans vos vraies données.",
            "test": "tester"
          }
        ]
      },
      {
        "title": "Publier l'ébauche",
        "body": [
          {
            "status": "Quand vous êtes sûr que votre ébauche est prête et que vous souhaitez la déployer sur vos appareils sur le terrain, vous pouvez la publier en utilisant le bouton de droite.",
            "link": {
              "full": "Quand vous êtes sûr que votre ébauche est prête et que vous souhaitez la déployer sur vos appareils sur le terrain, vous pouvez la {publish}.",
              "publish": "publier"
            }
          }
        ]
      }
    ]
  },
  "id": {
    "clickForInfo": "Klik di sini untuk mencari tahu lebih.",
    "steps": [
      {
        "title": "Unggah definisi formulir awal",
        "body": [
          "Kerja bagus!",
          "Desain formulir Anda telah berhasil dimuat."
        ]
      },
      {
        "title": "Unggah definisi formulir yang sudah direvisi (opsional)",
        "body": [
          {
            "status": "Apabila Anda sudah membuat perubahan terhadap formulir, termasuk teks pertanyaan atau peraturan logis, sekarang adalah waktunya mengunggah XML baru atau XLSForm menggunakan tombol yang ada di sebelah kanan.",
            "link": {
              "full": "Apabila Anda sudah membuat perubahan terhadap formulir, termasuk teks pertanyaan atau peraturan logis, sekarang adalah waktunya {upload} XML baru atau XLSForm.",
              "upload": "Unggah"
            }
          }
        ]
      },
      {},
      {
        "body": [
          {
            "full": "Anda bisa {test} formulir untuk memastikan kesesuaiannya dengan yang Anda ekspektasikan. Kiriman data dari hasil tes tidak akan dimasukkan ke dalam data akhir Anda.",
            "test": "mengetes"
          }
        ]
      },
      {
        "title": "Terbitkan Draf",
        "body": [
          {
            "status": "Ketika Anda yakin Draf sudah siap, Anda bisa menerbitkannya menggunakan tombol yang ada di sebelah kanan.",
            "link": {
              "full": "Ketika Anda yakin Draf sudah siap, Anda bisa {publish} menggunakan tombol yang ada di sebelah kanan.",
              "publish": "menerbitkannya"
            }
          }
        ]
      }
    ]
  },
  "it": {
    "clickForInfo": "Clicca qui per ulteriori informazioni",
    "steps": [
      {
        "title": "Carica la definizione del formulario iniziale",
        "body": [
          "Ben fatto!",
          "Il design del tuo formulario è stato caricato con successo."
        ]
      },
      {
        "title": "Carica la definizione del formulario revisionata (opzionale)",
        "body": [
          {
            "status": "Se hai apportato modifiche al formulario stesso, incluso il testo della domanda o le regole logiche, ora è il momento di caricare il nuovo XML o XLSForm utilizzando il pulsante a destra.",
            "link": {
              "full": "Se hai apportato modifiche al formulario stesso, incluso il testo della domanda o le regole logiche, ora è il momento di {upload} il nuovo XML o XLSForm.",
              "upload": "carica"
            }
          }
        ]
      },
      {},
      {
        "title": "Testa il formulario creando un invio",
        "body": [
          {
            "full": "Puoi {test} un formulario per assicurarti che funzioni come previsto. Gli invii di prova non sono inclusi nei dati finali.",
            "test": "test"
          }
        ]
      },
      {
        "title": "Pubblica bozza",
        "body": [
          {
            "status": "Quando sei sicuro che la tua bozza è pronta e desideri distribuirla sui tuoi dispositivi sul campo, puoi pubblicarla utilizzando il pulsante a destra.",
            "link": {
              "full": "Quando sei sicuro che la tua bozza è pronta e desideri distribuirla sui tuoi dispositivi sul campo, puoi {publish}.",
              "publish": "pubblica"
            }
          }
        ]
      }
    ]
  },
  "ja": {
    "clickForInfo": "さらに詳細を知るには、こちらをクリックして下さい。",
    "steps": [
      {
        "title": "初期バージョンの定義フォームのアップロード",
        "body": [
          "お疲れ様でした！",
          "フォームが正常に読み込まれました。"
        ]
      },
      {
        "title": "修正した定義フォームをアップロード（任意）",
        "body": [
          {
            "status": "フォームに質問文や理論式などの変更を加えた場合、右のボタンを使って更新したXMLまたはXLSFormをアップロードして下さい。",
            "link": {
              "full": "フォームに質問文や理論式などの変更を加えた場合、更新したXMLまたはXLSFormを{upload}するには、今がチャンスです。",
              "upload": "アップロード"
            }
          }
        ]
      },
      {},
      {
        "title": "提出フォームを作成して、フォームをテストする。",
        "body": [
          {
            "full": "フォームが期待通りに動作するかを{test}できます。テストの目的で提出されたフォームは、最終的なデータには含まれません。",
            "test": "テスト"
          }
        ]
      },
      {
        "title": "下書きの公開",
        "body": [
          {
            "status": "下書きの準備が整い、フィールドで用いる端末で運用開始したい場合、右のボタンを使って下書きを公開できます。",
            "link": {
              "full": "下書きの準備が整い、フィールドで用いる端末で運用開始したい場合、下書きを{publish}できます。",
              "publish": "公開"
            }
          }
        ]
      }
    ]
  },
  "sw": {
    "clickForInfo": "Bonyeza hapa kujua zaidi",
    "steps": [
      {
        "title": "Pakia ufafanuzi wa awali wa Fomu",
        "body": [
          "Kazi nzuri!",
          "Muundo wako wa Fomu umepakiwa."
        ]
      },
      {
        "title": "Pakia ufafanuzi wa Fomu uliorekebishwa (si lazima)",
        "body": [
          {
            "status": "Ikiwa umefanya mabadiliko kwenye Fomu yenyewe, ikijumuisha maandishi ya swali au sheria za mantiki, sasa ni wakati wa kupakia XML au XLSForm mpya kwa kutumia kitufe kilicho kulia.",
            "link": {
              "full": "Ikiwa umefanya mabadiliko kwenye Fomu yenyewe, ikijumuisha maandishi ya swali au sheria za mantiki, sasa ni wakati wa {upload} XML au XLSForm mpya.",
              "upload": "pakia"
            }
          }
        ]
      },
      {},
      {
        "title": "Jaribu Fomu kwa kuunda Wasilisho",
        "body": [
          {
            "full": "Unaweza {test} Fomu ili kuhakikisha kuwa inafanya kazi jinsi unavyotarajia. Mawasilisho ya Jaribio hayajumuishwi katika data yako ya mwisho.",
            "test": "Jaribia"
          }
        ]
      },
      {
        "title": "Chapisha Rasimu",
        "body": [
          {
            "status": "Unapokuwa na uhakika kuwa Rasimu yako iko tayari na ungependa kuisambaza kwa vifaa vyako kwenye uga, unaweza kuichapisha kwa kutumia kitufe kilicho kulia.",
            "link": {
              "full": "Unapokuwa na uhakika kuwa Rasimu yako iko tayari na ungependa kuisambaza kwa vifaa vyako kwenye uga, unaweza {publish}.",
              "publish": "Chapisha"
            }
          }
        ]
      }
    ]
  }
}
</i18n>
