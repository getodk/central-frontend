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
  <div id="public-link-list">
    <div class="heading-with-button">
      <button type="button" class="btn btn-primary" @click="createModal.show()">
        <span class="icon-plus-circle"></span>{{ $t('action.create') }}&hellip;
      </button>
      <p>
        <i18n-t keypath="heading[0].full">
          <template #state>
            <router-link :to="projectPath('form-access')">{{ $t('heading[0].state') }}</router-link>
          </template>
        </i18n-t>
        <sentence-separator/>
        <i18n-t keypath="moreInfo.clickHere.full">
          <template #clickHere>
            <doc-link to="central-submissions/#public-access-links">{{ $t('moreInfo.clickHere.clickHere') }}</doc-link>
          </template>
        </i18n-t>
      </p>
      <i18n-t tag="p" keypath="heading[1].full">
        <template #clickHere>
          <a href="#" @click.prevent="submissionOptions.show()">{{ $t('heading[1].clickHere') }}</a>
        </template>
      </i18n-t>
    </div>

    <public-link-table :highlighted="highlighted"
      @revoke="revokeModal.show({ publicLink: $event })"/>
    <loading :state="publicLinks.initiallyLoading"/>
    <p v-if="publicLinks.dataExists && publicLinks.length === 0"
      class="empty-table-message">
      {{ $t('emptyTable') }}
    </p>

    <public-link-create v-bind="createModal" @hide="createModal.hide()"
      @success="afterCreate"/>
    <project-submission-options v-bind="submissionOptions"
      @hide="submissionOptions.hide()"/>
    <public-link-revoke v-bind="revokeModal" @hide="revokeModal.hide()"
      @success="afterRevoke"/>
  </div>
</template>

<script>
import DocLink from '../doc-link.vue';
import Loading from '../loading.vue';
import ProjectSubmissionOptions from '../project/submission-options.vue';
import PublicLinkCreate from './create.vue';
import PublicLinkRevoke from './revoke.vue';
import PublicLinkTable from './table.vue';
import SentenceSeparator from '../sentence-separator.vue';

import useRoutes from '../../composables/routes';
import { apiPaths } from '../../util/request';
import { modalData } from '../../util/reactivity';
import { noop } from '../../util/util';
import { useRequestData } from '../../request-data';

export default {
  name: 'PublicLinkList',
  components: {
    DocLink,
    Loading,
    ProjectSubmissionOptions,
    PublicLinkCreate,
    PublicLinkRevoke,
    PublicLinkTable,
    SentenceSeparator
  },
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
  setup() {
    const { publicLinks } = useRequestData();
    const { projectPath } = useRoutes();
    return { publicLinks, projectPath };
  },
  data() {
    return {
      // The id of the highlighted public link
      highlighted: null,
      // Modals
      createModal: modalData(),
      submissionOptions: modalData(),
      revokeModal: modalData()
    };
  },
  created() {
    this.fetchData(false);
  },
  methods: {
    fetchData(resend) {
      this.publicLinks.request({
        url: apiPaths.publicLinks(this.projectId, this.xmlFormId),
        resend
      }).catch(noop);
      this.highlighted = null;
    },
    afterCreate(publicLink) {
      this.fetchData(true);
      this.createModal.hide();
      this.alert.success(this.$t('alert.create'));
      this.highlighted = publicLink.id;
    },
    afterRevoke(publicLink) {
      this.fetchData(true);
      this.revokeModal.hide();
      this.alert.success(this.$t('alert.revoke', publicLink));
    }
  }
};
</script>

<i18n lang="json5">
{
  "en": {
    "action": {
      "create": "Create Public Access Link",
    },
    "heading": [
      {
        "full": "Anyone with a Public Access Link can fill out this Form in a web browser. You can create multiple Links to track different distributions of the Form, to limit how long a specific group of people has access to the Form, and more. These links will only work if the Form is in the Open {state}.",
        "state": "state"
      },
      {
        "full": "Public Links are intended for self-reporting. If you are working with data collectors who need to submit the same Form multiple times, {clickHere} for other options.",
        "clickHere": "click here"
      }
    ],
    "emptyTable": "There are no Public Access Links for this Form.",
    "alert": {
      "create": "Your Public Access Link has been created and is now live. Copy it below to distribute it.",
      "revoke": "The Public Access Link “{displayName}” was revoked successfully. No further Submissions will be accepted using this Link."
    }
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "action": {
      "create": "Vytvořit veřejně přístupný odkaz"
    },
    "heading": [
      {
        "full": "Kdokoli s odkazem na veřejný přístup může vyplnit tento formulář ve webovém prohlížeči. Můžete vytvořit více odkazů pro sledování různých distribucí formuláře, abyste omezili, jak dlouho má určitá skupina lidí přístup k formuláři a další. Tyto odkazy budou fungovat, pouze pokud je formulář ve {state} Open.",
        "state": "stavu"
      },
      {
        "full": "Veřejné odkazy jsou určeny pro vlastní reportování. Pokud pracujete se sběrači dat, kteří potřebují zaslat stejný formulář vícekrát, {clickHere} pro jiné možnosti.",
        "clickHere": "klikněte zde"
      }
    ],
    "emptyTable": "Pro tento formulář neexistují žádné veřejně přístupné odkazy.",
    "alert": {
      "revoke": "Veřejně přístupný odkaz „{displayName}“ byl úspěšně odebrán. Pomocí tohoto odkazu nebudou přijata žádná další podání."
    }
  },
  "de": {
    "action": {
      "create": "Öffentlichen Zugangslink erstellen"
    },
    "heading": [
      {
        "full": "Jeder mit einem öffentlichen Zugangslink kann dieses Formular in einem Webbrowser ausfüllen. Sie können mehrere Links erstellen, um z.B. unterschiedliche Verteilungen des Formulars nachzuverfolgen oder zu begrenzen wie lange eine spezifische Gruppe von Menschen Zugriff auf das Formular hat. Diese Links funktionieren nur, wenn das Formular den {state} Offen hat.",
        "state": "Status"
      },
      {
        "full": "Öffentliche Links sind für das Selbstbeantworten gedacht. Wenn Sie mit Datensammlern arbeiten, die dasselbe Formular mehrfach übermitteln müssen, {clickHere} für andere Optionen.",
        "clickHere": "klicken Sie hier"
      }
    ],
    "emptyTable": "Es gibt keine öffentlichen Zugangslinks für dieses Formular.",
    "alert": {
      "create": "Ihr öffentlicher Zugangslink wurde erfolgreich erstellt und ist jetzt live. Kopieren Sie ihn unten, um ihn zu verteilen.",
      "revoke": "Der öffentliche Zugangslink \"{displayName}\" wurde erfolgreich widerrufen. Keine weiteren Übermittlungen über diesen Link werden akzeptiert."
    }
  },
  "es": {
    "action": {
      "create": "Crear enlace de acceso público"
    },
    "heading": [
      {
        "full": "Cualquier persona con un enlace de acceso público puede rellenar este formulario en un navegador web. Puede crear múltiples enlaces para rastrear diferentes distribuciones del formulario, para limitar el tiempo que un grupo específico de personas tiene acceso al Formulario, y más. Estos enlaces sólo funcionarán si el formulario está en el {state} abierto.",
        "state": "estado"
      },
      {
        "full": "Los enlaces públicos están pensados para autoinformarse. Si usted se encuentra trabajando con recolectores de datos que necesitan enviar el mismo formulario varias veces, {clickHere} para otras opciones.",
        "clickHere": "haga clic aquí"
      }
    ],
    "emptyTable": "No hay enlaces de acceso público para este formulario.",
    "alert": {
      "create": "Su enlace de acceso público ha sido creado y está ahora en vivo. Cópialo abajo para distribuirlo.",
      "revoke": "El enlace de acceso público \"{displayName}\" fue revocado con éxito. No se aceptarán más envíos a través de este enlace."
    }
  },
  "fr": {
    "action": {
      "create": "Créer lien d'accès public"
    },
    "heading": [
      {
        "full": "N'importe qui avec ce lien pourra remplir ce formulaire depuis leur navigateur. Vous pouvez créer plusieurs liens pour suivre d'où viennent vos répondants, pour limiter le temps d'accès au formulaire et ainsi de suite. Ces liens ne fonctionneront que si le formulaire et dans {state} \"ouvert\".",
        "state": "l'état"
      },
      {
        "full": "Les liens d'accès public sont conçus pour l'auto-évaluation. Si vous travaillez avec des collecteurs de données qui doivent soumettre le même formulaire plusieurs fois, {clickHere} pour d'autres méthodes d'envoi de données.",
        "clickHere": "cliquez ici"
      }
    ],
    "emptyTable": "Il n'y a aucun lien d'accès public pour ce formulaire.",
    "alert": {
      "create": "Votre lien d'accès public a été créé et est désormais accessible. Copiez le ci-dessous pour le distribuer.",
      "revoke": "Le lien d'accès public \"{displayName}\" a été révoqué avec succès. Aucune soumission ne sera acceptée depuis ce lien."
    }
  },
  "id": {
    "action": {
      "create": "Buat Tautan Akses Publik"
    },
    "heading": [
      {
        "full": "Siapapun dengan Tautan Akses Publik dapat mengisi formulir lewat web browser. Anda dapat membuat beberapa tautan untuk melacak pembagian formulir, membatasi seberapa lama kelompok tertentu memiliki akses formulir, dan banyak lagi. Tautan-tautan ini hanya akan berfungsi jika form berada dalam {state} Terbuka.",
        "state": "status"
      },
      {
        "full": "Tautan Publik dimaksudkan untuk laporan pribadi. Apabila Anda bekerja dengan pengumpul data yang butuh mengirimkan beberapa data dalam satu formulir yang sama, {clickHere} untuk pilihan lain.",
        "clickHere": "klik di sini"
      }
    ],
    "emptyTable": "Tidak ada Tautan Akses Publik untuk formulir ini.",
    "alert": {
      "revoke": "Tautan Akses Publik \"{displayName}\" telah berhasil dicabut. Tidak akan ada lagi kiriman data baru yang diterima lewat tautan ini."
    }
  },
  "it": {
    "action": {
      "create": "Crea Link con accesso pubblico"
    },
    "heading": [
      {
        "full": "Chiunque disponga di un collegamento di accesso pubblico può compilare questo formulario in un browser web. Puoi creare più collegamenti per tenere traccia delle diverse distribuzioni del formulario, per limitare la durata dell'accesso al formulario da parte di un gruppo specifico di persone e altro ancora. Questi collegamenti funzioneranno solo se il formulario è nello {state} \"aperto\".",
        "state": "stato"
      },
      {
        "full": "I link pubblici sono intesi per l'auto-riempimento. Se stai lavorando con raccoglitori di dati che devono inviare lo stesso formulario più volte, {clickHere} per altre opzioni.",
        "clickHere": "clicca qui"
      }
    ],
    "emptyTable": "Non ci sono link di accesso pubblico per questo formulario.",
    "alert": {
      "create": "Il tuo link di accesso pubblico è stato creato ed è ora attivo. Copialo qui sotto per distribuirlo.",
      "revoke": "Il link di accesso pubblico \"{displayName}\" è stato revocato con successo. Non saranno accettati ulteriori Invii utilizzando questo Link."
    }
  },
  "ja": {
    "action": {
      "create": "一般公開リンクの作成"
    },
    "heading": [
      {
        "full": "一般公開リンクを持っている人は誰でも、Webブラウザでこのフォームに記入できます。複数のリンクを作成し、フォームの異なる配布状況を追跡したり、特定のグループの人々がフォームにアクセスできる時間を制限することが可能です。これらのリンクは、フォームが公開中の{state}の場合にのみ機能します。",
        "state": "ステータス"
      },
      {
        "full": "一般公開リンクは、自己申告を目的としています。同じフォームを何度も送信する必要があるデータ収集者がいる場合は、{clickHere}して他の方法を確認して下さい。",
        "clickHere": "こちらをクリック"
      }
    ],
    "emptyTable": "このフォームに一般公開リンクはありません。",
    "alert": {
      "revoke": "一般公開リンク\"{displayName}\"の無効化に成功しました。以後、このリンクでのサフォームの提出は受付られません。"
    }
  },
  "pt": {
    "action": {
      "create": "Criar link de acesso público"
    },
    "heading": [
      {
        "full": "Qualquer pessoa com um link de acesso público pode preencher este formulário em um navegador de internet. Você pode criar vários links para rastrear distribuições diferentes do formulário, para limitar por quanto tempo um grupo específico de pessoas tem acesso ao formulário e muito mais. Esses links só funcionarão se o formulário estiver com {state} Aberto.",
        "state": "status"
      },
      {
        "full": "Links públicos destinam-se a preenchimento autônomo. Se você está trabalhando com coletores de dados que precisam responder o mesmo formulário várias vezes, {clickHere} para outras opções.",
        "clickHere": "clique aqui"
      }
    ],
    "emptyTable": "Não existem links de acesso público para esse formulário.",
    "alert": {
      "create": "Seu Link de Acesso Público foi criado e agora está ativo. Copie o endereço abaixo para distribuí-lo.",
      "revoke": "O link de acesso público \"{displayName}\" foi revogado com sucesso. Nenhuma resposta usando esse link será aceita de agora em diante."
    }
  },
  "sw": {
    "action": {
      "create": "Unda Kiungo cha Ufikiaji wa Umma"
    },
    "heading": [
      {
        "full": "Mtu yeyote aliye na Kiungo cha Ufikiaji wa Umma anaweza kujaza Fomu hii katika kivinjari. Unaweza kuunda Viungo vingi ili kufuatilia usambazaji tofauti wa Fomu, kuweka kikomo muda ambao kikundi mahususi cha watu kinaweza kufikia Fomu, na zaidi. Viungo hivi vitafanya kazi ikiwa tu Fomu iko katika {state} la Wazi.",
        "state": "Hali"
      },
      {
        "full": "Viungo vya Umma vimekusudiwa kujiripoti. Ikiwa unafanya kazi na wakusanyaji data ambao wanahitaji kuwasilisha Fomu sawa mara nyingi, {clickHere} kwa chaguo zingine.",
        "clickHere": "Bonyeza hapa"
      }
    ],
    "emptyTable": "Hakuna Viungo vya Ufikiaji wa Umma vya Fomu hii.",
    "alert": {
      "revoke": "Kiungo cha Ufikiaji wa Umma \"{displayName}\" kimebatilishwa. Hakuna Mawasilisho Zaidi yatakubaliwa kwa kutumia Kiungo hiki."
    }
  },
  "zh": {
    "action": {
      "create": "创建公开链接"
    },
    "heading": [
      {
        "full": "任何人通过公开访问链接均可使用网页浏览器填写此表单。您可以创建多个链接来追踪表单的分发渠道、限制特定用户群的访问时长等等。请注意，这些链接仅在表单处于公开{state}时有效。",
        "state": "状态"
      },
      {
        "full": "公开链接适用于自主填报场景。若您的数据收集者需要多次提交同一表单，请{clickHere}了解其他选项。",
        "clickHere": "点击这里"
      }
    ],
    "emptyTable": "此表单没有公开访问链接。",
    "alert": {
      "create": "您的公开访问链接已生成并生效。请复制下方链接进行使用。",
      "revoke": "公开访问链接 “{displayName}” 已成功撤销。此链接将不再接受任何提交。"
    }
  },
  "zh-Hant": {
    "action": {
      "create": "建立公共訪問連結"
    },
    "heading": [
      {
        "full": "任何擁有公共存取連結的人都可以在網頁瀏覽器中填寫此表格。您可以建立多個連結來追蹤表單的不同分發、限制特定人群存取表單的時間等等。只有當表單處於「開放{state}」時，這些連結才有效。",
        "state": "狀態"
      },
      {
        "full": "公共連結用於自我報告。如果您與需要多次提交相同表單的資料收集者合作，請{clickHere}以了解其他選項。",
        "clickHere": "點擊此處"
      }
    ],
    "emptyTable": "此表格沒有公共存取連結。",
    "alert": {
      "create": "您的公共存取連結已建立並且現已上線。複製下面的內容進行分發。",
      "revoke": "公共存取連結“{displayName}”已成功撤銷。使用此連結將不再接受任何提交。"
    }
  }
}
</i18n>
