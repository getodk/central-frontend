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
  <qr-panel class="field-key-qr-panel" :class="{ legacy: !managed }">
    <template #title>
      {{ managed ? $t('title.managed') : $t('title.legacy') }}
    </template>
    <template v-if="fieldKey != null" #body>
      <collect-qr :settings="settings" error-correction-level="L"
        :cell-size="3"/>
      <p>
        <i18n-t v-if="managed" keypath="body[0].managed.full">
          <template #managedCode>
            <strong>{{ $t('body[0].managed.managedCode') }}</strong>
          </template>
        </i18n-t>
        <i18n-t v-else keypath="body[0].legacy.full">
          <template #legacyCode>
            <strong>{{ $t('body[0].legacy.legacyCode') }}</strong>
          </template>
        </i18n-t>
        <sentence-separator/>
        <template v-if="managed">{{ $t('body[1].managed', fieldKey) }}</template>
        <template v-else>{{ $t('body[1].legacy') }}</template>
        <sentence-separator/>
        <i18n-t v-if="managed" keypath="body[2].managed.full">
          <template #switchToLegacy>
            <i18n-t tag="a" keypath="body[2].managed.switchToLegacy"
              class="switch-code" href="#">
              <template #legacyCode>
                <strong>{{ $t('body[2].managed.legacyCode') }}</strong>
              </template>
            </i18n-t>
          </template>
        </i18n-t>
        <i18n-t v-else keypath="body[2].legacy.full">
          <template #switchToManaged>
            <i18n-t tag="a" keypath="body[2].legacy.switchToManaged"
              class="switch-code" href="#">
              <template #managedCode>
                <strong>{{ $t('body[2].legacy.managedCode') }}</strong>
              </template>
            </i18n-t>
          </template>
        </i18n-t>
      </p>
      <p>
        <span>{{ $t('body[3]', fieldKey) }}</span>
        <sentence-separator/>
        <doc-link to="collect-import-export/">{{ $t('moreInfo.learnMore') }}</doc-link>
      </p>
    </template>
  </qr-panel>
</template>

<script>
import CollectQr from '../collect-qr.vue';
import DocLink from '../doc-link.vue';
import QrPanel from '../qr-panel.vue';
import SentenceSeparator from '../sentence-separator.vue';

import { apiPaths } from '../../util/request';
import { useRequestData } from '../../request-data';

export default {
  name: 'FieldKeyQrPanel',
  components: { CollectQr, DocLink, QrPanel, SentenceSeparator },
  props: {
    fieldKey: Object,
    managed: Boolean
  },
  setup() {
    const { project } = useRequestData();
    return { project };
  },
  computed: {
    settings() {
      const url = apiPaths.serverUrlForFieldKey(
        this.fieldKey.token,
        this.project.id
      );
      const settings = {
        general: { server_url: `${window.location.origin}${url}` },
        project: { name: this.project.name },
        // Collect requires the settings to have an `admin` property.
        admin: {}
      };
      if (this.managed) {
        settings.general.form_update_mode = 'match_exactly';
        settings.general.autosend = 'wifi_and_cellular';
      }
      return settings;
    }
  }
};
</script>

<style lang="scss">
.field-key-qr-panel {
  &.legacy {
    .panel-heading { background-color: #777; }
    .icon-mobile { color: #555; }
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    // This is the title at the top of a pop-up. "Client" refers to a data
    // collection client like ODK Collect. "Code" refers to a QR code.
    "title": {
      "managed": "Client Configuration Code",
      "legacy": "Legacy Client Configuration Code"
    },
    "body": [
      {
        "managed": {
          "full": "This is a {managedCode}.",
          "managedCode": "Managed QR Code"
        },
        "legacy": {
          "full": "This is a {legacyCode}.",
          "legacyCode": "Legacy QR Code"
        }
      },
      {
        // "Get Blank Form" is the text of a button in ODK Collect.
        "managed": "Collect will exactly match the Forms available to “{displayName}” including automatically applying updates. Users will not need to manually Get Blank Forms. Additionally, finalized Forms will be sent automatically as soon as a connection is found.",
        // "Get Blank Form" and "Send Finalized Form" are the text of buttons in ODK Collect.
        "legacy": "Users will have to manually Get Blank Forms on the device and determine which Forms to update. They will also need to manually Send Finalized Forms."
      },
      {
        "managed": {
          "full": "For the old behavior, {switchToLegacy}.",
          "switchToLegacy": "switch to a {legacyCode}",
          "legacyCode": "Legacy QR Code"
        },
        "legacy": {
          "full": "For a more controlled and foolproof process, {switchToManaged}.",
          "switchToManaged": "switch to a {managedCode}",
          "managedCode": "Managed QR Code"
        }
      },
      "Scan this QR code to configure a device with the account “{displayName}”."
    ]
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "title": {
      "managed": "Konfigurační kód klienta",
      "legacy": "Konfigurační kód staršího klienta"
    },
    "body": [
      {
        "managed": {
          "full": "Toto je {managedCode}.",
          "managedCode": "Spravovaný QR kód"
        },
        "legacy": {
          "full": "Toto je {legacyCode}.",
          "legacyCode": "Starší QR kód"
        }
      },
      {
        "managed": "Collect bude přesně odpovídat dostupným formulářům na „{displayName}“, včetně automatického použití aktualizací. Uživatelé nebudou muset ručně získávat prázdné formuláře. Dokončené formuláře budou navíc automaticky odeslány, jakmile bude nalezeno spojení.",
        "legacy": "Uživatelé budou muset ručně získat prázdné formuláře v zařízení a určit, které formuláře se mají aktualizovat. Budou také muset ručně odeslat konečné formuláře."
      },
      {
        "managed": {
          "full": "Pro staré chování, {switchToLegacy}.",
          "switchToLegacy": "přepněte na {legacyCode}",
          "legacyCode": "Starší QR kód"
        },
        "legacy": {
          "full": "Pro více kontrolovaný a spolehlivý proces, {switchToManaged}.",
          "switchToManaged": "přepněte na {managedCode}",
          "managedCode": "Spravovaný QR kód"
        }
      },
      "Naskenováním tohoto QR kódu nakonfigurujete zařízení s účtem “{displayName}“."
    ]
  },
  "de": {
    "title": {
      "managed": "Client Configuration Code",
      "legacy": "Legacy Client Configuration Code"
    },
    "body": [
      {
        "managed": {
          "full": "Das ist ein {managedCode}.",
          "managedCode": "Managed QR-Code"
        },
        "legacy": {
          "full": "Das ist ein {legacyCode}.",
          "legacyCode": "Legacy QR-Code"
        }
      },
      {
        "managed": "Collect wird die für \"{displayName}\" verfügbaren Formulare genau abgleichen und automatisch Updates anwenden. Benutzer müssen Leerformulare nicht manuell herunterladen. Außerdem werden abgeschlossene Formulare automatisch übermittelt sobald eine Verbindung vorhanden ist.",
        "legacy": "Benutzer müssen manuell auf dem Gerät Leerformulare herunterladen und Formulare zum Updaten auswählen. Sie müssen außerdem manuell vollständige Formulare hochladen."
      },
      {
        "managed": {
          "full": "Für das alte Verhalten {switchToLegacy}.",
          "switchToLegacy": "auf {legacyCode} umschalten",
          "legacyCode": "Legacy QR-Code"
        },
        "legacy": {
          "full": "Für einen kontrollierteren und idiotensicheren Prozess {switchToManaged}.",
          "switchToManaged": "auf {managedCode} umschalten",
          "managedCode": "Managed QR-Code"
        }
      },
      "Scannen Sie diesen QR-Code, um ein Gerät mit dem Konto \"{displayName}\" zu konfigurieren."
    ]
  },
  "es": {
    "title": {
      "managed": "Código de configuración del cliente",
      "legacy": "Código de configuración de cliente heredado"
    },
    "body": [
      {
        "managed": {
          "full": "Este es un {managedCode}",
          "managedCode": "Código QR gestionado"
        },
        "legacy": {
          "full": "Este es un {legacyCode}",
          "legacyCode": "Código QR heredado"
        }
      },
      {
        "managed": "Collect coincidirá exactamente con los formularios disponibles para {displayName}, incluida la aplicación automática de actualizaciones. Los usuarios no necesitarán obtener formularios en blanco manualmente. Además, los formularios finalizados se enviarán automáticamente tan pronto como se encuentre una conexión.",
        "legacy": "Los usuarios deberán obtener manualmente formularios en blanco en el dispositivo y determinar qué formularios actualizar. También necesitarán enviar formularios finalizados manualmente"
      },
      {
        "managed": {
          "full": "Por el viejo comportamiento, {switchToLegacy}",
          "switchToLegacy": "cambiar a un {legacyCode}",
          "legacyCode": "Código QR heredado"
        },
        "legacy": {
          "full": "Para un proceso más controlado e infalible, {switchToManaged}",
          "switchToManaged": "cambiar a un {managedCode}",
          "managedCode": "Código QR gestionado"
        }
      },
      "Escanee este código QR para configurar un dispositivo con la cuenta \"{displayName}\""
    ]
  },
  "fr": {
    "title": {
      "managed": "Code de configuration du client.",
      "legacy": "Ancien code de configuration de client"
    },
    "body": [
      {
        "managed": {
          "full": "Ceci est un {managedCode}.",
          "managedCode": "QR Code administré"
        },
        "legacy": {
          "full": "Ceci est un {legacyCode}.",
          "legacyCode": "Ancien QR Code"
        }
      },
      {
        "managed": "Collect reflétera exactement les formulaires disponibles sur “{displayName}” incluant leurs mises à jour automatiques. Les utilisateurs n'auront plus à télécharger les formulaires vierges. En outre, les formulaires finalisés seront envoyés automatiquement, dés qu'une connexion sera trouvée.",
        "legacy": "Les utilisateurs devront manuellement télécharger les formulaires vierges sur le téléphone et choisir quels formulaires mettre à jour. Ils devront aussi envoyer les formulaires finalisés manuellement."
      },
      {
        "managed": {
          "full": "Pour l'ancien comportement, {switchToLegacy}.",
          "switchToLegacy": "Changez pour un {legacyCode}",
          "legacyCode": "ancien QR Code"
        },
        "legacy": {
          "full": "Pour un processus plus contrôlé et infaillible, {switchToManaged}.",
          "switchToManaged": "Changer pour un {managedCode}",
          "managedCode": "QR Code administré"
        }
      },
      "Scannez ce QR Code pour configurer un téléphone avec le compte “{displayName}”."
    ]
  },
  "id": {
    "title": {
      "managed": "Kode Konfigurrasi Klien",
      "legacy": "Kode Konfigurasi Klien Versi Lama"
    },
    "body": [
      {
        "managed": {
          "full": "Ini adalah {managedCode}.",
          "managedCode": "Kode QR yang dikelola"
        },
        "legacy": {
          "full": "Ini adalah {legacyCode}.",
          "legacyCode": "kode QR Versi Lama"
        }
      },
      {
        "legacy": "Pengguna harus mendapatkan formulir kosong secara manual di perangkat dan menentukan formulir mana yang akan diperbarui. Pengguna juga harus mengirim formulir yang telah selesai secara manual."
      },
      {
        "managed": {
          "full": "Untuk cara lama, {switchToLegacy}.",
          "switchToLegacy": "beralih ke {legacyCode}",
          "legacyCode": "Kode QR versi Lama"
        },
        "legacy": {
          "full": "Untuk proses yang lebih terkontrol dan terpercaya, {switchToManaged}.",
          "switchToManaged": "beralih ke {managedCode}",
          "managedCode": "Kode QR yang Dikelola"
        }
      },
      "Pindai kode QR ini untuk mengonfigurasi perangkat dengan akun tersebut “{displayName}”."
    ]
  },
  "it": {
    "title": {
      "managed": "Codice configurazione del Client",
      "legacy": "Codice di configurazione client legacy"
    },
    "body": [
      {
        "managed": {
          "full": "Questo è un {managedCode}.",
          "managedCode": "Codice QR gestito"
        },
        "legacy": {
          "full": "Questo è un {legacyCode}.",
          "legacyCode": "Codice QR legacy"
        }
      },
      {
        "managed": "Collect corrisponderà esattamente ai formulari disponibili per \"{displayName}\", inclusa l'applicazione automatica degli aggiornamenti. Gli utenti non dovranno recuperare manualmente i formulari vuoti. Inoltre, i formulari finalizzati verranno inviati automaticamente non appena viene trovata una connessione.",
        "legacy": "Gli utenti dovranno recuperare manualmente i formulari vuoti sul dispositivo e stabilire quali formulari aggiornare. Dovranno anche inviare manualmente i formulari finalizzati."
      },
      {
        "managed": {
          "full": "Per il vecchio modo di operare, {switchToLegacy}.",
          "switchToLegacy": "passare a {legacyCode}",
          "legacyCode": "Codice QR legacy"
        },
        "legacy": {
          "full": "Per un processo più controllato e prova d'errore,{switchToManaged}.",
          "switchToManaged": "passare a {managedCode}",
          "managedCode": "Codice QR gestito"
        }
      },
      "Scansiona questo codice QR per configurare un dispositivo con l'account \"{displayName}\"."
    ]
  },
  "ja": {
    "title": {
      "managed": "クライアントの設定コード",
      "legacy": "従来のクライアント設定コード"
    },
    "body": [
      {
        "managed": {
          "full": "これは{managedCode}です。",
          "managedCode": "管理型のQRコード"
        },
        "legacy": {
          "full": "これは{legacyCode}です。",
          "legacyCode": "従来型のQRコード"
        }
      },
      {
        "managed": "ODK Collectは、「{displayName}」で利用可能なフォームと完全に一致し、アップデートも自動的に適用されます。ユーザーが手動で空フォームを取得する必要はありません。さらに、インターネット接続が見つかった時点で、確定済のフォームが自動的に送信されます。",
        "legacy": "ユーザーは、手動で端末に空フォームを取得し、更新するフォームを決定する必要があります。また、確定済フォームを手動で提出する必要があります。"
      },
      {
        "managed": {
          "full": "従来通りの操作のためには、{switchToLegacy}",
          "switchToLegacy": "{legacyCode}に切り替える。",
          "legacyCode": "従来型のQRコード"
        },
        "legacy": {
          "full": "より管理された確実な処理のために、{switchToManaged}",
          "switchToManaged": "{managedCode}に切り替える。",
          "managedCode": "管理型のQRコード"
        }
      },
      "このQRコードをスキャンして、アカウント名\"{displayName}\"の端末を設定する。"
    ]
  },
  "pt": {
    "title": {
      "managed": "Código de configuração de cliente",
      "legacy": "Código legado de configuração do cliente"
    },
    "body": [
      {
        "managed": {
          "full": "Isso é um {managedCode}.",
          "managedCode": "Código QR gerenciado"
        },
        "legacy": {
          "full": "Isso é um {legacyCode}.",
          "legacyCode": "Código QR legado"
        }
      },
      {
        "managed": "O Collect irá fazer a correspondência exata dos formulários disponíveis para \"{displayName}\" aplicando atualizações de forma automática. Os usuários não precisarão obter formulários em branco de forma manual. Além disso, respostas marcadas como finalizadas serão enviadas automaticamente assim que uma conexão de rede for encontrada.",
        "legacy": "Os usuários terão que obter formulários em branco de forma manual no dispositivo e determinar quais formulários devem ser atualizados. Eles também precisarão enviar manualmente respostas finalizadas."
      },
      {
        "managed": {
          "full": "Para o comportamento anterior, {switchToLegacy}.",
          "switchToLegacy": "altere para um {legacyCode}",
          "legacyCode": "Código QR legado"
        },
        "legacy": {
          "full": "Para um processo mais controlado e à prova de bobagens, {switchToManaged}.",
          "switchToManaged": "mudar para um {managedCode}",
          "managedCode": "Código QR gerenciado"
        }
      },
      "Use um scanner de código QR para configurar um dispositivo com a conta \"{displayName}\"."
    ]
  },
  "sw": {
    "title": {
      "managed": "Msimbo wa Usanidi wa Mteja",
      "legacy": "Msimbo wa Usanidi wa Mteja wa Urithi"
    },
    "body": [
      {
        "managed": {
          "full": "Hii ni {managedCode}",
          "managedCode": "Msimbo wa QR unaosimamiwa"
        },
        "legacy": {
          "full": "Hii ni {legacyCode}.",
          "legacyCode": "Msimbo wa QR wa urithi"
        }
      },
      {
        "managed": "Mkusanyiko utalingana kabisa na Fomu zinazopatikana kwa \"{displayName}\" ikijumuisha kutumia masasisho kiotomatiki. Watumiaji hawatahitaji Kujipatia Fomu tupu. Zaidi ya hayo, Fomu zilizokamilishwa zitatumwa kiotomatiki mara tu muunganisho utakapopatikana.",
        "legacy": "Watumiaji watalazimika Kupata mwenyewe Fomu tupu kwenye kifaa na kuamua ni Fomu zipi za kusasisha. Pia watahitaji Kutuma mwenyewe Fomu Zilizokamilishwa"
      },
      {
        "managed": {
          "full": "Kwa tabia ya zamani, {switchToLegacy}",
          "switchToLegacy": "badilisha hadi {legacyCode}",
          "legacyCode": "Msimbo wa QR wa urithi"
        },
        "legacy": {
          "full": "Kwa mchakato unaodhibitiwa zaidi na usiofaa, {switchToManaged}",
          "switchToManaged": "badilisha hadi {managedCode}",
          "managedCode": "Msimbo wa QR unaosimamiwa"
        }
      },
      "Changanua msimbo huu wa QR ili kusanidi kifaa kilicho na akaunti \"{displayName}\"."
    ]
  },
  "zh": {
    "title": {
      "managed": "客户端配置代码",
      "legacy": "旧版客户端配置代码"
    },
    "body": [
      {
        "managed": {
          "full": "这是一个{managedCode}。",
          "managedCode": "收管的QR Code"
        },
        "legacy": {
          "full": "这是一个{legacyCode}。",
          "legacyCode": "旧版QR Code"
        }
      },
      {
        "managed": "Collect将精确同步“{displayName}”可用的所有表单，并自动更新。用户无需手动获取空白表单。此外，只要检测到网络连接，已完成的表单将立即自动上传。",
        "legacy": "用户需要在设备上手动获取空白表单，并决定更新哪些表单。同时，他们也需手动提交已完成表单。"
      },
      {
        "managed": {
          "full": "如需恢复旧版操作模式，请{switchToLegacy}。",
          "switchToLegacy": "切换到{legacyCode}",
          "legacyCode": "旧版QR Code"
        },
        "legacy": {
          "full": "要启用更严谨可靠的受控流程，请{switchToManaged}。",
          "switchToManaged": "切换到{managedCode}",
          "managedCode": "收管的QR Code"
        }
      },
      "扫描此QR Code以将账户{displayName}配置到设备。"
    ]
  },
  "zh-Hant": {
    "title": {
      "managed": "客戶端配置QR code",
      "legacy": "舊版客戶端配置QR code"
    },
    "body": [
      {
        "managed": {
          "full": "此為一個 {managedCode}。",
          "managedCode": "管理 QR Code"
        },
        "legacy": {
          "full": "這是一個 {legacyCode}。",
          "legacyCode": "舊版 QR Code"
        }
      },
      {
        "managed": "Collect 將與「{displayName}」可用的表單完全匹配，包括自動套用更新。用戶無需手動取得空白表格。此外，一旦找到連接，最終的表格將自動發送。",
        "legacy": "使用者必須在裝置上手動取得空白表單並確定要更新哪些表單。他們還需要手動發送最終表格。"
      },
      {
        "managed": {
          "full": "對於舊的行為， {switchToLegacy}。",
          "switchToLegacy": "切換到 {legacyCode}",
          "legacyCode": "舊版 QR Code"
        },
        "legacy": {
          "full": "為了實現更受控和萬無一失的過程， {switchToManaged}。",
          "switchToManaged": "切換到{managedCode}",
          "managedCode": "管理 QR Code"
        }
      },
      "掃描此 QR code 即可使用「{displayName}」帳戶配置到設備。"
    ]
  }
}
</i18n>
