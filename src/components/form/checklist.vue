<!--
Copyright 2019 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div v-if="dataExists" id="form-checklist">
    <checklist-step :stage="stepStage(0)">
      <template #title>{{ $t('steps[0].title') }}</template>
      <p>
        <strong>{{ $t('steps[0].body[0]') }}</strong>
        <sentence-separator/>
        <span>{{ $t('steps[0].body[1]') }}</span>
        <sentence-separator/>
        <doc-link to="central-forms/#updating-forms-to-a-new-version">{{ $t('clickForInfo') }}</doc-link>
      </p>
    </checklist-step>
    <checklist-step :stage="stepStage(1)">
      <template #title>{{ $t('steps[1].title') }}</template>
      <p>
        <template v-if="form.submissions === 0">{{ $t('steps[1].body[0].none') }}</template>
        <template v-else>{{ $tcn('steps[1].body[0].any', form.submissions) }}</template>
        <sentence-separator/>
        <i18n :tag="false" path="steps[1].body[1].full">
          <template #clickHere>
            <a href="#" @click.prevent="$emit('show-submission-options')">{{ $t('steps[1].body[1].clickHere') }}</a>
          </template>
        </i18n>
      </p>
    </checklist-step>
    <checklist-step :stage="stepStage(2)">
      <template #title>{{ $t('steps[2].title') }}</template>
      <p>
        <template v-if="form.submissions === 0">{{ $t('steps[2].body[0].none') }}</template>
        <template v-else>{{ $tcn('steps[2].body[0].any', form.submissions) }}</template>
        <sentence-separator/>
        <i18n :tag="false" path="steps[2].body[1].full">
          <template #submissionsTab>
            <router-link :to="formPath('submissions')">{{ $t('steps[2].body[1].submissionsTab') }}</router-link>
          </template>
        </i18n>
        <sentence-separator/>
        <doc-link to="central-submissions/">{{ $t('clickForInfo') }}</doc-link>
      </p>
    </checklist-step>
    <checklist-step :stage="stepStage(3)">
      <template #title>{{ $t('steps[3].title') }}</template>
      <p>
        <i18n :tag="false" path="steps[3].body[0].full">
          <template #formAccessTab>
            <router-link :to="projectPath('form-access')">{{ $t('steps[3].body[0].formAccessTab') }}</router-link>
          </template>
        </i18n>
        <sentence-separator/>
        <doc-link to="central-forms/#managing-form-lifecycle">{{ $t('clickForInfo') }}</doc-link>
      </p>
    </checklist-step>
  </div>
</template>

<script>
import ChecklistStep from '../checklist-step.vue';
import DocLink from '../doc-link.vue';
import SentenceSeparator from '../sentence-separator.vue';

import routes from '../../mixins/routes';
import { requestData } from '../../store/modules/request';

// The component does not assume that this data will exist when the component is
// created.
const requestKeys = ['project', 'form'];

export default {
  name: 'FormChecklist',
  components: { ChecklistStep, DocLink, SentenceSeparator },
  mixins: [routes()],
  computed: {
    ...requestData(requestKeys),
    dataExists() {
      return this.$store.getters.dataExists(requestKeys);
    },
    // Indicates whether each step is complete.
    stepCompletion() {
      return [
        true,
        this.form.submissions !== 0,
        false,
        this.form.state !== 'open'
      ];
    },
    currentStep() {
      return this.stepCompletion.findIndex(complete => !complete);
    }
  },
  methods: {
    stepStage(step) {
      return this.stepCompletion[step]
        ? 'complete'
        : (step === this.currentStep ? 'current' : 'later');
    }
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
        "title": "Publish your first Draft version",
        "body": [
          "Great work!",
          "You have published your Form. It is ready to accept Submissions. If you want to make changes to the Form or its Media Files, you can make a new Draft."
        ]
      },
      {
        // This is the title of a checklist item.
        "title": "Download Form on survey clients and submit data",
        "body": [
          {
            "none": "Nobody has submitted any data to this Form yet.",
            "any": "A total of {count} Submission has been made. | A total of {count} Submissions have been made."
          },
          {
            "full": "{clickHere} to learn about the different ways to submit data.",
            "clickHere": "Click here"
          }
        ]
      },
      {
        // This is the title of a checklist item.
        "title": "Evaluate and analyze submitted data",
        "body": [
          {
            "none": "Once there is data for this Form, you can export or synchronize it to monitor and analyze the data for quality and results.",
            "any": "You can export or synchronize the {count} Submission on this Form to monitor and analyze the Submission for quality and results. | You can export or synchronize the {count} Submissions on this Form to monitor and analyze them for quality and results."
          },
          {
            "full": "You can do this with the Download and Analyze buttons on the {submissionsTab}.",
            "submissionsTab": "Submissions tab"
          }
        ]
      },
      {
        // This is the title of a checklist item. "Retirement" refers to reducing access to the form. For example, removing the ability to download the form or to submit to it.
        "title": "Manage Form retirement",
        "body": [
          {
            "full": "As you come to the end of your data collection, you can use the Form State controls on the {formAccessTab} to control whether, for example, App Users will be able to see or create new Submissions to this Form.",
            "formAccessTab": "Form Access tab of the Project page"
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
    "clickForInfo": "klikněte sem a dozvíte se více",
    "steps": [
      {
        "title": "Zveřejněte svou první verzi konceptu",
        "body": [
          "Skvělá práce!",
          "Publikovali jste svůj formulář. Je připraven přijímat příspěvky. Pokud chcete provést změny ve formuláři nebo jeho mediálních souborech, můžete vytvořit nový koncept."
        ]
      },
      {
        "title": "Stáhněte si formulář o klientech průzkumu a odešlete data",
        "body": [
          {
            "none": "Do tohoto formuláře zatím nikdo nezadal žádné údaje.",
            "any": "Celkem byl odeslán {count} příspěvek. | Celkem byly odeslány {count} příspěvky | Celkem bylo odesláno {count} příspěvků. | Celkem bylo odesláno {count} příspěvků."
          },
          {
            "full": "{clickHere} abyste se dozvěděli o různých způsobech zadávání údajů.",
            "clickHere": "Klikněte zde"
          }
        ]
      },
      {
        "title": "Vyhodnotit a analyzovat odeslaná data",
        "body": [
          {
            "none": "Jakmile budou pro tento formulář k dispozici data, můžete je exportovat nebo synchronizovat a sledovat a analyzovat data z hlediska kvality a výsledků.",
            "any": "Můžete exportovat nebo synchronizovat {count} příspěvek v tomto formuláři a sledovat a analyzovat příspěvek z hlediska kvality a výsledků. | Můžete exportovat nebo synchronizovat {count} příspěvky v tomto formuláři a sledovat a analyzovat příspěvky z hlediska kvality a výsledků. | Můžete exportovat nebo synchronizovat {count} příspěvků v tomto formuláři a sledovat a analyzovat příspěvky z hlediska kvality a výsledků. | Můžete exportovat nebo synchronizovat {count} příspěvků v tomto formuláři a sledovat a analyzovat příspěvky z hlediska kvality a výsledků."
          },
          {
            "full": "Můžete to udělat pomocí tlačítek Stáhnout a Analyzovat na {submissionsTab}.",
            "submissionsTab": "Karta příspěvků"
          }
        ]
      },
      {
        "title": "Spravovat časové uspání formulářů",
        "body": [
          {
            "full": "Až budete na konci svého sběru dat, můžete pomocí ovládacích prvků Stav formuláře na {formAccessTab} ovládat, zda například Uživatelé aplikace budou moci vidět nebo vytvářet nová odeslání do tohoto formuláře.",
            "formAccessTab": "Karta Přístup k formuláři na stránce Projektu"
          }
        ]
      }
    ]
  },
  "de": {
    "clickForInfo": "Klicken Sie hier, um mehr zu erfahren.",
    "steps": [
      {
        "title": "Veröffentlichen Sie Ihre ersten Entwurf",
        "body": [
          "Gut gemacht!",
          "Sie haben ein Formular veröffentlicht und können nun Übermittlungen dafür einreichen. Wenn Sie Änderungen an dem Formular oder den zugeordneten Mediendateien machen wollen, können Sie einen neuen Entwurf erstellen."
        ]
      },
      {
        "title": "Das Formular der Befragungsteilnehmer herunterladen und Daten einreichen",
        "body": [
          {
            "none": "Bisher hat noch niemand Daten für dieses Formular hochgeladen.",
            "any": "Es wurde {count} Übermittlung durchgeführt. | Es wurden {count} Übermittlungen durchgeführt."
          },
          {
            "full": "{clickHere}, um mehr über die unterschiedlichen Möglichkeiten der Datenübermittlung zu erfahren.",
            "clickHere": "Klicken Sie hier"
          }
        ]
      },
      {
        "title": "Auswertung der übermittelten Daten",
        "body": [
          {
            "none": "Wenn es Daten für dieses Formular gibt, können Sie diese zur Überwachung und Analyse exportieren oder synchronisieren.",
            "any": "Sie können die {count} Übermittlung für dieses Formular zur Qualitiätsüberwachung exportieren oder synchronisieren. | Sie können die {count} Übermittlungen für dieses Formular zur Qualitiätsüberwachung exportieren oder synchronisieren."
          },
          {
            "full": "Sie können dies über die Buttons Herunterladen und Analysieren auf dem {submissionsTab} durchführen.",
            "submissionsTab": "Reiter Übermittlungen"
          }
        ]
      },
      {
        "title": "Formular-Deaktivierung verwalten",
        "body": [
          {
            "full": "Wenn Sie sich dem Ende der Datenaufnahme nähern, können Sie die Schaltflächen für den Formularstatus auf dem {formAccessTab} benutzen, um Benutzern zu erlauben, dass sie Übermittlungen anschauen oder neu erstellen können.",
            "formAccessTab": "Formular-Zugriff-Tab der Projekt-Seite"
          }
        ]
      }
    ]
  },
  "es": {
    "clickForInfo": "Haga clic aquí para descubrir más.",
    "steps": [
      {
        "title": "Publique su primera versión borrador",
        "body": [
          "¡Buen trabajo!",
          "Ha publicado su formulario. Está listo para aceptar envíos. Si desea realizar cambios en el formulario o sus archivos multimedia, puede crear un nuevo borrador."
        ]
      },
      {
        "title": "Descargar el formulario en la aplicación móvil y envíe datos.",
        "body": [
          {
            "none": "Nadie ha enviado datos a este formulario todavía.",
            "any": "Se ha enviado un total de {count} envío a este servidor. | Se han enviado un total de {count} envíos a este servidor."
          },
          {
            "full": "{clickHere} para aprender sobre las diferentes maneras de enviar datos.",
            "clickHere": "Haga clic aquí"
          }
        ]
      },
      {
        "title": "Evaluar y analizar los datos enviados.",
        "body": [
          {
            "none": "Una vez que haya datos para este formulario, puede exportarlo o sincronizarlo para monitorear y analizar los datos en cuanto a calidad y resultados.",
            "any": "Puede exportar o sincronizar el {count} envío en este formulario para monitorearlo y analizarlo en cuanto a calidad y resultados. | Puede exportar o sincronizar los {count} envíos en este formulario para monitorearlos y analizarlos en cuanto a calidad y resultados."
          },
          {
            "full": "Puede hacerlo con los botones descargar y analizar en la {submissionsTab}",
            "submissionsTab": "pestaña envíos"
          }
        ]
      },
      {
        "title": "Gestionar retiro de Formulario",
        "body": [
          {
            "full": "Cuando llegue al final de su recopilación de datos, puede usar los controles de estado del formulario en la {formAccessTab} para controlar si, por ejemplo, los usuarios móviles podrán ver o crear nuevos envíos a este formulario.",
            "formAccessTab": "Pestaña acceso a Formulario de la página del proyecto"
          }
        ]
      }
    ]
  },
  "fr": {
    "clickForInfo": "Cliquez ici pour en savoir plus.",
    "steps": [
      {
        "title": "Publier votre première ébauche",
        "body": [
          "Beau travail !",
          "Vous avez publié votre formulaire. Il est prêt à accepter des soumissions. Si vous voulez apporter des changements au formulaire ou à ses fichiers médias, vous pouvez créer une nouvelle ébauche."
        ]
      },
      {
        "title": "Télécharger le formulaire sur les clients et envoyer des données",
        "body": [
          {
            "none": "Personne n'a encore soumis de données pour ce formulaire.",
            "any": "Un total de {count} soumission a été faite. | Un total de {count} soumissions ont été faites."
          },
          {
            "full": "{clickHere} pour vous renseigner sur les diverses méthodes d'envoi de données.",
            "clickHere": "Cliquez ici"
          }
        ]
      },
      {
        "title": "Évaluer et analyser les données soumises",
        "body": [
          {
            "none": "Dés qu'il y a des données pour ce formulaire, vous pouvez les exporter ou les synchroniser pour suivre et analyser leur qualité et les résultats.",
            "any": "Vous pouvez exporter ou synchroniser la {count} soumission de ce formulaire pour suivre et analyser la qualité des données et les résultats. | Vous pouvez exporter ou synchroniser les {count} soumissions de ce formulaire pour suivre et analyser la qualité des données et les résultats."
          },
          {
            "full": "Vous pouvez faire cela en utilisant les boutons \"Télécharger\" et \"Analyser\" de l'{submissionsTab}.",
            "submissionsTab": "onglet \"soumissions\""
          }
        ]
      },
      {
        "title": "Gérer les limitations d'accès au formulaire",
        "body": [
          {
            "full": "Lorsque vous arrivez à la fin de votre collecte de données, vous pouvez utiliser les contrôles de l'État du formulaire sur {formAccessTab} pour contrôler si, par exemple, les utilisateurs mobiles seront en mesure de voir ou de créer de nouvelles soumissions à ce formulaire.",
            "formAccessTab": "onglet \"accès aux formulaires\" de la page du projet"
          }
        ]
      }
    ]
  },
  "id": {
    "clickForInfo": "Klik di sini untuk mencari lebih banyak.",
    "steps": [
      {
        "title": "Terbitkan versi pertama draf Anda",
        "body": [
          "Kerja bagus!",
          "Formulir Anda telah diterbitkan dan siap menerima kiriman data. Apabila Anda ingin membuat perubahan terhadap formulir atau file media, Anda dapat membuat draf baru."
        ]
      },
      {
        "title": "Unduh formulir survei klien dan ajukan data",
        "body": [
          {
            "none": "Belum ada pengajuan data di formulir ini.",
            "any": "Total {count} kiriman data sudah dibuat."
          },
          {
            "full": "{clickHere} untuk mempelajari cara-cara mengajukan data.",
            "clickHere": "Klik di sini"
          }
        ]
      },
      {
        "title": "Evaluasi dan analisis data yang telah masuk",
        "body": [
          {
            "none": "Setelah ada data untuk formulir ini, Anda bisa mengeskpor atau mensinkronisasi data tersebut ke monitor dan menganalisisnya untuk kualitas dan hasil.",
            "any": "Anda bisa mengekspor atau mensinkronisasi {count} data yang sudah masuk di formulir ini ke monitor dan menganalisisnya untuk kualitas dan hasil."
          },
          {
            "full": "Anda bisa melakukannya dengan menekan tombol Unduh dan Analisis pada {submissionsTab}.",
            "submissionsTab": "Tab kiriman data"
          }
        ]
      },
      {
        "title": "Atur formulir yang sudah tidak aktif",
        "body": [
          {
            "full": "Setelah Anda selesai mengumpulkan data, Anda bisa menggunakan pengaturan Status Formulir pada {formAccessTab} untuk mengatur, misalnya, apakah Pengguna Aplikasi masih bisa melihat atau membuat kiriman data baru untuk formulir ini.",
            "formAccessTab": "Tab Akses Formulir pada laman Proyek"
          }
        ]
      }
    ]
  },
  "ja": {
    "clickForInfo": "さらに詳細を知るには、こちらをクリックして下さい。",
    "steps": [
      {
        "title": "最初の下書きバージョンを公開",
        "body": [
          "お疲れ様でした！",
          "フォームは公開されました。フォームの提出を受付ける準備が整いました。このフォームや関連するメディアファイルに変更を行いたい場合、新しい下書きフォームを作成することができます。"
        ]
      },
      {
        "title": "調査クライアントへのフォームのダウンロードとフォームの提出",
        "body": [
          {
            "none": "このフォームには、どなたもまだデータを提出していません。",
            "any": "合計{count}件のフォームの提出が完了しました。"
          },
          {
            "full": "{clickHere}して、様々なフォーム提出の方法を知る。",
            "clickHere": "ここをクリック"
          }
        ]
      },
      {
        "title": "提出されたデータの評価と解析",
        "body": [
          {
            "none": "このフォームのデータがあれば、それをエクスポートまたは同期して、その品質と結果を、監視および解析することができます。",
            "any": "このフォームの{count}件の提出済フォームをエクスポートまたは同期して、その品質と結果を、監視および解析することができます。"
          },
          {
            "full": "{submissionsTab}の「ダウンロード」と「解析」ボタンで行うことができます。",
            "submissionsTab": "提出済フォームのタブ"
          }
        ]
      },
      {
        "title": "フォームへのアクセス除外者を管理",
        "body": [
          {
            "full": "あなたはデータ収集を終えましたので、{formAccessTab}にあるフォームの状態のコントロールを使って、これから先、例えば、アプリユーザーがこのフォームを閲覧できるか、新しい提出フォームを作成できるかを設定できます。",
            "formAccessTab": "プロジェクトページのフォームアクセスタブ"
          }
        ]
      }
    ]
  }
}
</i18n>
