<!--
Copyright 2017 ODK Central Developers
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
    <div class="heading-with-button">
      <button id="field-key-list-create-button" type="button"
        class="btn btn-primary" @click="createModal.show()">
        <span class="icon-plus-circle"></span>{{ $t('action.create') }}&hellip;
      </button>
      <i18n-t tag="p" keypath="heading[0].full">
        <template #collect>
          <doc-link to="collect-intro/">ODK Collect</doc-link>
        </template>
        <template #formAccess>
          <router-link :to="projectPath('form-access')">{{ $t('heading[0].formAccess') }}</router-link>
        </template>
      </i18n-t>
      <i18n-t tag="p" keypath="heading[1].full">
        <template #clickHere>
          <a href="#" @click.prevent="submissionOptions.show()">{{ $t('heading[1].clickHere') }}</a>
        </template>
      </i18n-t>
    </div>
    <table id="field-key-list-table" class="table">
      <thead>
        <tr>
          <th>{{ $t('header.displayName') }}</th>
          <th>{{ $t('header.created') }}</th>
          <th>{{ $t('header.lastUsed') }}</th>
          <th>{{ $t('header.configureClient') }}</th>
          <th class="actions">{{ $t('header.actions') }}</th>
        </tr>
      </thead>
      <tbody v-if="fieldKeys.dataExists">
        <field-key-row v-for="fieldKey of fieldKeys" :key="fieldKey.id"
          :field-key="fieldKey" :highlighted="highlighted"
          @toggle-qr="togglePopover"
          @revoke="revokeModal.show({ fieldKey: $event })"/>
      </tbody>
    </table>
    <loading :state="fieldKeys.initiallyLoading"/>
    <p v-if="fieldKeys.dataExists && fieldKeys.length === 0"
      class="empty-table-message">
      {{ $t('emptyTable') }}
    </p>

    <popover ref="popover" :target="popover.target" placement="left"
      @hide="hidePopover">
      <field-key-qr-panel :field-key="popover.fieldKey" :managed="managed"/>
    </popover>
    <field-key-new v-bind="createModal" :managed="managed"
      @hide="createModal.hide()" @success="afterCreate"/>
    <project-submission-options v-bind="submissionOptions"
      @hide="submissionOptions.hide()"/>
    <field-key-revoke v-bind="revokeModal" @hide="revokeModal.hide()"
      @success="afterRevoke"/>
  </div>
</template>

<script>
import Popover from '../popover.vue';
import DocLink from '../doc-link.vue';
import Loading from '../loading.vue';
import FieldKeyQrPanel from './qr-panel.vue';
import FieldKeyRow from './row.vue';
import FieldKeyNew from './new.vue';
import FieldKeyRevoke from './revoke.vue';
import ProjectSubmissionOptions from '../project/submission-options.vue';

import useRoutes from '../../composables/routes';
import { modalData } from '../../util/reactivity';
import { useRequestData } from '../../request-data';

export default {
  name: 'FieldKeyList',
  components: {
    Popover,
    DocLink,
    Loading,
    FieldKeyQrPanel,
    FieldKeyRow,
    FieldKeyNew,
    FieldKeyRevoke,
    ProjectSubmissionOptions
  },
  inject: ['alert'],
  props: {
    projectId: {
      type: String,
      required: true
    }
  },
  emits: ['fetch-field-keys'],
  setup() {
    const { fieldKeys } = useRequestData();
    const { projectPath } = useRoutes();
    return { fieldKeys, projectPath };
  },
  data() {
    return {
      // The id of the highlighted app user
      highlighted: null,
      // `true` to show a managed QR code; `false` to show a legacy QR code.
      managed: true,
      popover: {
        target: null,
        fieldKey: null
      },
      // Modals
      createModal: modalData(),
      submissionOptions: modalData(),
      revokeModal: modalData()
    };
  },
  created() {
    this.fetchData(false);
  },
  mounted() {
    document.addEventListener('click', this.switchCode);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.switchCode);
  },
  methods: {
    fetchData(resend) {
      this.$emit('fetch-field-keys', resend);
      this.highlighted = null;
    },
    hidePopover() {
      this.popover.target = null;
      this.popover.fieldKey = null;
    },
    togglePopover(fieldKey, link) {
      if (this.popover.target == null) {
        this.popover.target = link;
        this.popover.fieldKey = fieldKey;
      } else {
        this.hidePopover();
      }
    },
    switchCode(event) {
      if (event.target.closest('.field-key-qr-panel .switch-code') == null)
        return;

      event.preventDefault();
      this.managed = !this.managed;

      if (this.popover.target != null) {
        this.$nextTick(() => {
          document.querySelector('.popover .field-key-qr-panel .switch-code')
            .focus();
        });
      }
    },
    afterCreate(fieldKey) {
      this.fetchData(true);
      this.createModal.hide();
      this.alert.success(this.$t('alert.create', fieldKey));
      this.highlighted = fieldKey.id;
    },
    afterRevoke(fieldKey) {
      this.fetchData(true);
      this.revokeModal.hide();
      this.alert.success(this.$t('alert.revoke', fieldKey));
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#field-key-list-table {
  table-layout: fixed;

  th.actions { width: 125px; }
}
</style>

<i18n lang="json5">
{
  "en": {
    "action": {
      "create": "Create App User"
    },
    "heading": [
      {
        // {collect} is a link whose text is "ODK Collect".
        "full": "App Users are used to collect data from an application such as {collect}. They typically represent a shared role such as “Vaccinator” but may also represent individuals. App Users in this Project can only download and use Forms within this Project. When you create a new App User, it will not have access to any Forms at first. To set the Forms each App User may access, use the {formAccess} tab.",
        "formAccess": "Form Access"
      },
      {
        "full": "App Users are most appropriate when data collectors need access to multiple Forms, are offline, or you have a complex Form. If you need respondents to self-report or have an online-only form, {clickHere} for other options.",
        "clickHere": "click here"
      }
    ],
    "header": {
      "lastUsed": "Last Used",
      // Header for the table column that shows QR codes to configure data collection clients such as ODK Collect.
      "configureClient": "Configure Client"
    },
    "emptyTable": "There are no App Users yet. You will need to create some to download Forms and submit data from your device.",
    "alert": {
      "create": "The App User “{displayName}” was created successfully.",
      "revoke": "App User {displayName}’s access successfully revoked."
    }
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "action": {
      "create": "Vytvořit uživatele aplikace"
    },
    "heading": [
      {
        "full": "Uživatelé aplikace se používají ke sběru dat z aplikace, jako např. {collect}. Obvykle představují společnou roli, jako je „Vakcinátor“, ale mohou představovat i jednotlivce. Uživatelé aplikace v tomto projektu mohou stahovat a používat pouze formuláře v rámci tohoto projektu. Když vytvoříte nového uživatele aplikace, nebude mít nejprve přístup k žádným formulářům. Chcete-li nastavit formuláře, ke kterým má každý uživatel aplikace přístup, použijte kartu {formAccess}.",
        "formAccess": "Přístup k formuláři"
      },
      {
        "full": "Uživatelé aplikace jsou nejvhodnější, když sběratelé dat potřebují přístup k více formulářům, jsou offline nebo máte složitý formulář. Pokud potřebujete respondenty k vlastnímu hlášení nebo máte pouze formulář online, {clickHere} pro další možnosti.",
        "clickHere": "klikněte zde"
      }
    ],
    "header": {
      "lastUsed": "Naposledy použitý",
      "configureClient": "Konfigurovat klienta"
    },
    "emptyTable": "Zatím nejsou žádní uživatelé aplikace. Pro stažení formulářů a odeslání dat z vašeho zařízení budete muset vytvořit nějaké.",
    "alert": {
      "create": "Uživatel aplikace „{displayName}“ byl úspěšně vytvořen."
    }
  },
  "de": {
    "action": {
      "create": "App-Benutzer erstellen"
    },
    "heading": [
      {
        "full": "App-Benutzer werden benutzt, um Daten von einer App wie {collect} zu sammeln. Sie repräsentieren typischerweise eine geteilte Rolle wie \"Impfarzt\" aber können auch einzelne Idividuen repräsentieren. App-Benutzer in diesem Projekt können nur Formulare aus diesem Projekt herunterladen und benutzen. Wenn Sie einen neuen App-Benutzer erstellen, wird er oder sie zunächst keinen Zugriff auf Formulare haben. Um Formulare für einen Benutzer zugänglich zu machen, verwenden Sie den Reiter {formAccess}.",
        "formAccess": "Formular-Zugriff"
      },
      {
        "full": "App-Benutzer sind am passendsten, wenn Datensammler Zugriff auf mehrere Formulare benötigen, offline sind oder wenn Sie ein komplexes Formular haben. Wenn Antwortende eine Selbsteinschätzung durchführen müssen oder Sie ein reines Online-Formular haben, {clickHere} für andere Optionen.",
        "clickHere": "klicken Sie hier"
      }
    ],
    "header": {
      "lastUsed": "Zuletzt benutzt",
      "configureClient": "Client konfigurieren"
    },
    "emptyTable": "Ès gibt noch keine Benutzer der App. Sie müssen zumindest einen erstellen, um Formulare herunterladen zu können und um Daten aus Ihrem Gerät hochzuladen.",
    "alert": {
      "create": "Der App-Benutzer \"{displayName}\" ist erstellt worden.",
      "revoke": "Der Zugriff des App-Benutzers {displayName} wurde erfolgreich widerrufen."
    }
  },
  "es": {
    "action": {
      "create": "Crear usuario móvil"
    },
    "heading": [
      {
        "full": "Los usuarios móviles se utilizan para recolectar datos desde una aplicación tal como {collect}. Típicamente representan un rol compartido como “Vacunador” pero también pueden representar a individuos. Los usuarios móviles en este proyecto solo pueden descargar y usar formularios en este proyecto. Cuando usted crea un nuevo usuario móvil, al principio este no tendrá acceso a ningún formulario. Para definir los formularios a los que cada usuario móvil puede acceder, utilice la pestaña {formAccess}.",
        "formAccess": "Acceso a Formulario"
      },
      {
        "full": "Los usuarios móviles son más apropiados cuando los recopiladores de datos necesitan acceso a varios formularios, están fuera de línea o tiene un Formulario complejo. Si necesita que los encuestados se autoinforme o tengan un formulario solo en línea, {clickHere} busque otras opciones.",
        "clickHere": "haga clic aquí"
      }
    ],
    "header": {
      "lastUsed": "Última utilizada",
      "configureClient": "Configurar cliente"
    },
    "emptyTable": "Todavía no hay usuarios móviles. Deberá crear algunos para descargar formularios y enviar datos desde su dispositivo.",
    "alert": {
      "create": "El usuario móvil \"{displayName}\" se creó correctamente.",
      "revoke": "El usuario móvil \"{displayName}\" ha sido revocado con éxito."
    }
  },
  "fr": {
    "action": {
      "create": "Créer un utilisateur mobile"
    },
    "heading": [
      {
        "full": "Les utilisateurs mobiles sont utilisés pour faire la collecte de données depuis une application telle que {collect}. Ils représentent typiquement un rôle générique tel que \"agent de vaccination\" mais peuvent aussi représenter des individus. Les utilisateurs mobiles dans ce projet peuvent seulement télécharger et utiliser les formulaires du projet. Quand vous créez un nouvel utilisateur mobile, il n'aura accès à aucun formulaire. Pour définir les formulaires auxquels chaque utilisateur mobile peut accéder, utilisez l'onglet {formAccess}.",
        "formAccess": "\"accès aux formulaires\""
      },
      {
        "full": "Les utilisateurs mobiles conviennent particulièrement bien quand les collecteurs de données doivent accéder à plusieurs formulaires, sont hors-ligne, ou ont des formulaires complexes. Si vous voulez que des répondants remplissent directement votre formulaire ou vos collecteurs de données auront toujours accès à l'Internet, {clickHere} pour d'autres méthodes d'envoi de données.",
        "clickHere": "cliquez ici"
      }
    ],
    "header": {
      "lastUsed": "Dernière utilisation",
      "configureClient": "Configurer le client"
    },
    "emptyTable": "Il n'y a pas encore d’utilisateur mobile. Vous devez en créer pour télécharger des formulaires et soumettre des données depuis votre appareil.",
    "alert": {
      "create": "L'utilisateur mobile “{displayName}” a été correctement créé.",
      "revoke": "L'accès de l'utilisateur mobile “{displayName}” a été retiré ."
    }
  },
  "id": {
    "action": {
      "create": "Buat Pengguna Aplikasi"
    },
    "heading": [
      {
        "full": "Pengguna Aplikasi bertugas untuk mengumpulkan data dari aplikasi seperti {collect}. Mereka biasanya merepresentasikan peran bersama, seperti \"Vaksinator\", atau bisa juga merepresentasikan secara individu. Pengguna Aplikasi di proyek ini hanya dapat mengunduh dan menggunakan formulir yang tergabung dalam proyek ini. Ketika Anda membuat Pengguna Aplikasi baru, Anda tidak akan mendapatkan akses ke formulir apapun pada tahap awal. Untuk mengatur formulir yang dapat diakses oleh setiap Pengguna Aplikasi, gunakan tab {formAccess}.",
        "formAccess": "Akses Formulir"
      },
      {
        "full": "Pengguna Aplikasi sangat membantu ketika pengumpul data membutuhkan akses ke berbagai formulir, sedang offline, atau ketika Anda memiliki formulir yang kompleks. Apabila Anda membutuhkan responden untuk laporan pribadi atau formulir yang hanya dapat diakses secara online, {clickHere} untuk pilihan lain.",
        "clickHere": "klik di sini"
      }
    ],
    "header": {
      "lastUsed": "Terakhir Digunakan",
      "configureClient": "Klien Konfigurasi"
    },
    "emptyTable": "Belum ada Pengguna Aplikasi. Anda harus membuatnya terlebih dahulu untuk mengunduh formulir dan mengajukan data lewat perangkat Anda.",
    "alert": {
      "create": "Pengguna Aplikasi \"{displayName}\" sukses dibuat."
    }
  },
  "it": {
    "action": {
      "create": "Creare un Utente App"
    },
    "heading": [
      {
        "full": "Gli Utenti App raccolgono i dati tramite un'applicazione come {collect}. In genere rappresentano un ruolo condiviso come per esempio di \"Vaccinatore\", ma possono anche rappresentare individui. Gli Utenti App in questo progetto possono scaricare e utilizzare i formulari solo all'interno di questo progetto. Quando crei un nuovo Utente App, inizialmente non avrà accesso a nessun formulario. Per impostare i formulari a cui ogni Utente App può accedere, utilizza la scheda {formAccess}.",
        "formAccess": "Accesso al form"
      },
      {
        "full": "Gli utenti dell'app sono più appropriati quando i raccoglitori di dati devono accedere a più formulari, sono offline o hai un formulario complesso. Se hai bisogno che gli intervistati rispondano da se o dispongano di un formulario solo online, {clickHere} per altre opzioni.",
        "clickHere": "clicca qui"
      }
    ],
    "header": {
      "lastUsed": "Utilzzato ultima volta",
      "configureClient": "Configurare il Client"
    },
    "emptyTable": "Non ci sono ancora utenti dell'app. Dovrai crearne alcuni per scaricare i formulari e inviare i dati dal tuo dispositivo.",
    "alert": {
      "create": "L'Utente App \"{displayName}\" è stato creato correttamente.",
      "revoke": "L'accesso per Utente App {displayName} è stato revocato con successo."
    }
  },
  "ja": {
    "action": {
      "create": "アプリユーザーの作成"
    },
    "heading": [
      {
        "full": "アプリユーザーは、{collect} などのアプリケーションによる収集データに使用します。通常、アプリユーザーは「ワクチン接種従事者」のような共有の役割を示しますが、個人を示すこともあります。このプロジェクトのアプリユーザーは、このプロジェクトのフォームのみをダウンロードして使用できます。新規のアプリユーザーを作成しても、初期状態ではどのフォームにもアクセスできません。各アプリユーザーがアクセスできるフォームを設定するには、{formAccess}タブを使用します。",
        "formAccess": "フォームへのアクセス"
      },
      {
        "full": "アプリユーザーは、データ収集者が複数のフォームにアクセスする必要がある場合やオフラインの場合、または複雑なフォームを使用している場合に最適です。回答者に自己申告してもらう必要がある場合や、オンラインのみのフォームの場合は、{clickHere}して他の選択肢を見て下さい。",
        "clickHere": "こちらをクリック"
      }
    ],
    "header": {
      "lastUsed": "最終利用日時",
      "configureClient": "クライアントの設定"
    },
    "emptyTable": "アプリユーザーが登録されていません。デバイスからフォームのダウンロードと提出を行うには、アプリユーザーを作成する必要があります。",
    "alert": {
      "create": "アプリユーザー\"{displayName}\"は正常に作成されました。"
    }
  },
  "pt": {
    "action": {
      "create": "Criar usuário de aplicativo"
    },
    "heading": [
      {
        "full": "Usuários de aplicativo são usados para coletar dados usando uma aplicação como o {collect}. Eles tipicamente representam uma função como \"Vacinador\" mas também podem representar indivíduos. Usuários de aplicativo nesse projeto pode baixar e utilizar formulários apenas dentro desse projeto. Quando você cria um novo usuário de aplicativo, ele não terá acesso a nenhum formulário inicialmente. Para definir os formulários que cada usuário de aplicativo pode acessar, utilize a aba {formAccess}.",
        "formAccess": "Acesso ao formulário"
      },
      {
        "full": "Usuários de aplicativo são mais apropriados quando coletores de dados precisam acessar múltiplos formulários, não tem acesso constante à internet, ou quando você tem um formulário complexo. Se você precisa que os entrevistados preencham o formulário sozinhos ou ter o formulário disponível apenas na internet, {clickHere} para outras opções.",
        "clickHere": "clique aqui"
      }
    ],
    "header": {
      "lastUsed": "Última utilização em",
      "configureClient": "Configurar cliente"
    },
    "emptyTable": "Não existe nenhum usuário de aplicativo ainda. Você terá que criar um para baixar formulários e enviar dados a partir do seu dispositivo.",
    "alert": {
      "create": "O usuário de aplicativo \"{displayName}\" foi criado com sucesso."
    }
  },
  "sw": {
    "action": {
      "create": "Unda Mtumiaji wa Programu"
    },
    "heading": [
      {
        "full": "Watumiaji wa Programu hutumiwa kukusanya data kutoka kwa programu kama vile {collect}. Kwa kawaida huwakilisha jukumu la pamoja kama vile \"Chanjo\" lakini pia zinaweza kuwakilisha watu binafsi. Watumiaji wa Programu katika Mradi huu wanaweza kupakua na kutumia Fomu ndani ya Mradi huu pekee. Unapounda Mtumiaji mpya wa Programu, haitakuwa na ufikiaji wa Fomu zozote mwanzoni. Ili kuweka Fomu ambazo kila Mtumiaji wa Programu anaweza kufikia, tumia kichupo cha {formAccess}.",
        "formAccess": "Ufikiaji wa Fomu"
      },
      {
        "full": "Watumiaji wa Programu wanafaa zaidi wakati wakusanyaji wa data wanahitaji ufikiaji wa Fomu nyingi, wako nje ya mtandao, au una Fomu ngumu. Ikiwa unahitaji watu waliojibu kuripoti binafsi au kuwa na fomu ya mtandaoni pekee, {clickHere} kwa chaguo zingine.",
        "clickHere": "bonyeza hapa"
      }
    ],
    "header": {
      "lastUsed": "Iliyotumika Mwisho",
      "configureClient": "Sanidi Mteja"
    },
    "emptyTable": "Bado hakuna Watumiaji wa Programu. Utahitaji kuunda baadhi ili kupakua Fomu na kuwasilisha data kutoka kwa kifaa chako",
    "alert": {
      "create": "Mtumiaji wa Programu \"{displayName}\" ameundwa."
    }
  },
  "zh": {
    "action": {
      "create": "新建App用户"
    },
    "heading": [
      {
        "full": "App用户通常从数据收集应用（如 {collect}）中收集数据。他们通常代表“疫苗接种员”等角色，也可代表个人用户。本项目中的App用户仅能下载并使用本项目内的表单。新创建的App用户一开始将无法访问任何表单，请使用 {formAccess} 选项，设置各App用户可访问的表单。",
        "formAccess": "表单权限"
      },
      {
        "full": "App用户最适合以下场景：数据收集员需使用多个表单、处于离线工作状态，或需处理复杂表单。若需受访者自主填报或只使用在线表单，请{clickHere}了解其他选项。",
        "clickHere": "点击此处"
      }
    ],
    "header": {
      "lastUsed": "上次更新",
      "configureClient": "设置Client"
    },
    "emptyTable": "目前没有App用户。您需要新建表格并从您的设备上传数据。",
    "alert": {
      "create": "App用户“{displayName}”已成功建立。",
      "revoke": "App用户{displayName}的权限已成功撤销。"
    }
  },
  "zh-Hant": {
    "action": {
      "create": "建立APP使用者"
    },
    "heading": [
      {
        "full": "APP使用者用於從應用程式（例如 {collect}）收集資料。他們通常代表一個共同的角色，例如「疫苗接種者」，但也可能代表個人。本專案內的App使用者只能下載和使用本專案內的表單。當您建立新的APP使用者時，它首先無法存取任何表單。若要設定每個應用程式使用者可以存取的表單，請使用 {formAccess} 標籤。",
        "formAccess": "表單存取"
      },
      {
        "full": "當資料收集者需要存取多個表單、離線或您有複雜的表單時，應用程式使用者是最合適的。如果您需要受訪者自我報告或擁有僅限線上的表格，請{clickHere}了解其他選項。",
        "clickHere": "點選此處"
      }
    ],
    "header": {
      "lastUsed": "最後更新",
      "configureClient": "設定客戶端"
    },
    "emptyTable": "還沒有應用程式用戶。您將需要建立一些表格來下載表格並從您的裝置提交資料。",
    "alert": {
      "create": "APP使用者「{displayName}」已成功建立。",
      "revoke": "App 使用者{displayName}的存取權成功撤銷。"
    }
  }
}
</i18n>
