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
  <div id="backup-status">
    <span id="backup-status-icon" :class="iconClass"></span>

    <template v-if="status === 'notConfigured'">
      <p>{{ $t('notConfigured[0]') }}</p>
      <p><strong>{{ $t('notConfigured[1]') }}</strong></p>
      <i18n tag="p" path="notConfigured[2].full">
        <template #recommended>
          <strong>{{ $t('notConfigured[2].recommended') }}</strong>
        </template>
      </i18n>
      <p>{{ $t('notConfigured[3]') }}</p>
    </template>
    <template v-else-if="status === 'neverRun'">
      <p>{{ $t('neverRun[0]') }}</p>
      <p>{{ $t('neverRun[1]') }}</p>
      <p>
        <i18n :tag="false" path="neverRun[2].full">
          <template #terminate>
            <strong>{{ $t('neverRun[2].terminate') }}</strong>
          </template>
        </i18n>
        <sentence-separator/>
        <i18n :tag="false" path="getHelp.full">
          <template #forum>
            <a href="https://forum.getodk.org/" target="_blank">{{ $t('getHelp.forum') }}</a>
          </template>
        </i18n>
      </p>
    </template>
    <template v-else-if="status === 'somethingWentWrong'">
      <p>{{ $t('somethingWentWrong[0]') }}</p>
      <i18n tag="p" path="somethingWentWrong[1].full">
        <template #moreThanThreeDaysAgo>
          <strong>{{ $t('somethingWentWrong[1].moreThanThreeDaysAgo') }}</strong>
        </template>
      </i18n>
      <p>
        <i18n :tag="false" path="somethingWentWrong[2].full">
          <template #terminate>
            <strong>{{ $t('somethingWentWrong[2].terminate') }}</strong>
          </template>
        </i18n>
        <sentence-separator/>
        <i18n :tag="false" path="getHelp.full">
          <template #forum>
            <a href="https://forum.getodk.org/" target="_blank">{{ $t('getHelp.forum') }}</a>
          </template>
        </i18n>
      </p>
    </template>
    <template v-else>
      <p>{{ $t('success[0]') }}</p>
      <i18n tag="p" path="success[1]">
        <template #dateTime>
          <strong id="backup-status-most-recently-logged-at">
            <date-time :iso="auditsForBackupsConfig[0].loggedAt"/>
          </strong>
        </template>
      </i18n>
    </template>

    <div>
      <template v-if="status === 'notConfigured'">
        <button type="button" class="btn btn-primary" @click="$emit('create')">
          <span class="icon-plus-circle"></span>{{ $t('action.setUp') }}&hellip;
        </button>
      </template>
      <template v-else>
        <a class="btn btn-primary" :class="{ disabled: downloading }"
          href="/v1/backup" @click="download">
          <span class="icon-arrow-circle-down"></span>{{ $t('action.download') }}
          <spinner :state="downloading"/>
        </a>
        <button type="button" class="btn btn-danger"
          @click="$emit('terminate')">
          <span class="icon-times-circle"></span>{{ $t('action.terminate') }}&hellip;
        </button>
      </template>
    </div>
  </div>
</template>

<script>
import { DateTime } from 'luxon';
import { mapGetters } from 'vuex';

import DateTimeComponent from '../date-time.vue';
import SentenceSeparator from '../sentence-separator.vue';
import Spinner from '../spinner.vue';

import { ago } from '../../util/date-time';
import { requestData } from '../../store/modules/request';

export default {
  name: 'BackupStatus',
  components: { DateTime: DateTimeComponent, SentenceSeparator, Spinner },
  data() {
    return {
      downloading: false
    };
  },
  computed: {
    // The component assumes that this data will exist when the component is
    // created.
    ...requestData(['backupsConfig']),
    ...mapGetters(['auditsForBackupsConfig']),
    status() {
      if (this.backupsConfig.isEmpty()) return 'notConfigured';
      const latestAudit = this.auditsForBackupsConfig[0];
      // The earliest DateTime that is still considered recent for the purposes
      // of this component
      const recentThreshold = ago({ days: 3 });
      // No recent backup attempt
      if (latestAudit == null ||
        DateTime.fromISO(latestAudit.loggedAt) < recentThreshold) {
        const setAt = DateTime.fromISO(this.backupsConfig.get().setAt);
        return setAt < recentThreshold ? 'somethingWentWrong' : 'neverRun';
      }
      return latestAudit.details.success ? 'success' : 'somethingWentWrong';
    },
    iconClass() {
      switch (this.status) {
        case 'notConfigured':
          return 'icon-question-circle';
        case 'neverRun':
        case 'success':
          return 'icon-check-circle';
        default: // 'somethingWentWrong'
          return 'icon-times-circle';
      }
    }
  },
  methods: {
    download(event) {
      if (!this.downloading) {
        this.$alert().success(this.$t('alert.download'));
        this.downloading = true;
      } else {
        event.preventDefault();
      }
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#backup-status {
  margin-bottom: 35px;
  position: relative;

  .btn + .btn { margin-left: 5px; }
}

#backup-status-icon {
  font-size: 32px;
  position: absolute;
  top: 4px;

  &.icon-question-circle { color: #999; }
  &.icon-check-circle { color: $color-success; }
  &.icon-times-circle { color: $color-danger; }

  ~ * { margin-left: 41px; }
  + p { font-size: 28px; }
}
</style>

<i18n lang="json5">
{
  "en": {
    "getHelp": {
      "full": "If you are having trouble, please try the {forum}.",
      "forum": "community forum"
    },
    "notConfigured": [
      "Backups are not configured.",
      "The data server has not been set up to automatically back up its data anywhere.",
      {
        "full": "Unless you have set up some other form of data backup that the server doesn’t know about, it is {recommended} that you do this now. If you are not sure, it is best to do it just to be safe.",
        "recommended": "strongly recommended"
      },
      "Automatic data backups happen through this system once a day. All your data is encrypted with a password you provide so that only you can unlock it."
    ],
    "neverRun": [
      "The configured backup has not yet run.",
      "If you have configured backups within the last couple of days, this is normal. Otherwise, something has gone wrong.",
      {
        "full": "In that case, the most likely fixes are to {terminate} the connection and set it up again, or to restart the service.",
        "terminate": "terminate"
      }
    ],
    "somethingWentWrong": [
      "Something is wrong!",
      {
        "full": "The latest backup that completed successfully was {moreThanThreeDaysAgo}.",
        "moreThanThreeDaysAgo": "more than three days ago"
      },
      {
        "full": "The most likely fixes are to {terminate} the connection and set it up again, or to restart the service.",
        "terminate": "terminate"
      }
    ],
    "success": [
      // This text is displayed if the latest backup attempt was successful. It indicates that the backup process is working.
      "Backup is working.",
      // {dateTime} shows the date and time at which the last backup completed,
      // for example: "2020/01/01 01:23". It may show a formatted date like
      // "2020/01/01", or it may use a word like "today", "yesterday", or
      // "Sunday". {dateTime} is formatted in bold.
      "The last backup completed successfully {dateTime}."
    ],
    "action": {
      "setUp": "Set up now",
      "download": "Download backup now",
      "terminate": "Terminate"
    },
    "alert": {
      "download": "The backup is running now, and will be encrypted and downloaded to your computer. This may take a while. Once the download begins, you can leave this page."
    }
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "getHelp": {
      "full": "Pokud máte potíže, zkuste prosím {forum}.",
      "forum": "komunitní fórum"
    },
    "notConfigured": [
      "Zálohy nejsou nakonfigurovány.",
      "Datový server nebyl nastaven tak, aby automaticky zálohoval jeho data kdekoli.",
      {
        "full": "Pokud jste nenastavili nějakou jinou formu zálohování dat, o které server neví, je {recommended}, že to uděláte nyní. Pokud si nejste jisti, je nejlepší to udělat jen proto, abyste byli v bezpečí.",
        "recommended": "silně doporučeno"
      },
      "Automatické zálohování dat probíhá prostřednictvím tohoto systému jednou denně. Všechna vaše data jsou zašifrována pomocí hesla, které zadáte, abyste je mohli odemknout pouze vy."
    ],
    "neverRun": [
      "Nakonfigurované zálohování dosud nebylo spuštěno.",
      "Pokud jste nakonfigurovali zálohování v posledních několika dnech, je to normální. Jinak se něco pokazilo.",
      {
        "full": "V takovém případě je nejpravděpodobnější opravou {terminate} připojení a opětovné nastavení nebo restartování služby.",
        "terminate": "ukončení"
      }
    ],
    "somethingWentWrong": [
      "Něco je špatně!",
      {
        "full": "Poslední úspěšná záloha byla {moreThanThreeDaysAgo}.",
        "moreThanThreeDaysAgo": "před více než třemi dny"
      },
      {
        "full": "Nejpravděpodobnější opravou je {terminate} připojení a znovu nastavení, nebo restartování služby.",
        "terminate": "ukončit"
      }
    ],
    "success": [
      "Zálohování funguje.",
      "Poslední záloha byla úspěšně dokončena {dateTime}."
    ],
    "action": {
      "setUp": "Nastavit nyní",
      "download": "Stáhnout zálohu hned",
      "terminate": "Ukončit"
    },
    "alert": {
      "download": "Záloha nyní běží a bude šifrována a stažena do vašeho počítače. Může to chvíli trvat. Jakmile začne stahování, můžete tuto stránku opustit."
    }
  },
  "de": {
    "getHelp": {
      "full": "Wenn es nicht funktioniert, fragen Sie im {forum} nach.",
      "forum": "Community-Forum"
    },
    "notConfigured": [
      "Sicherungskopien sind nicht konfiguriert.",
      "Der Datenserver ist nicht für eine automatische Sicherung konfiguriert.",
      {
        "full": "Wenn Sie nicht irgendeine andere Methode der Datensicherung implementiert haben, von der der Server nichts weiß, wird {recommended}, dass Sie jetzt eine Konfiguration vornehmen. Wenn Sie sich nicht sicher sind, ob eine Datensicherung besteht, konfigurieren Sie einfach eine weitere - doppelt gesichert schläft sich's bessert.",
        "recommended": "dringend empfohlen"
      },
      "Automatische Sicherungen des gesamten Systems werden einmal am Tag durchgeführt. Alle Ihre Daten werden mit einem von Ihnen vergebenen Passwort verschlüsselt, und nur Sie können sie entschlüsseln."
    ],
    "neverRun": [
      "Die konfigurierte Sicherung ist wurde noch nicht ausgeführt.",
      "Wenn Sie die Sicherungen in den letzten Tagen konfiguriert haben, ist dies normal. Wenn nicht, ist irgendetwas schief gegangen.",
      {
        "full": "In diesem Falle ist es am besten, wenn Sie die Verbindung {terminate} und danach neu starten. Alternativ können Sie den Dienst neu starten.",
        "terminate": "beenden"
      }
    ],
    "somethingWentWrong": [
      "Irgendetwas hat da nicht geklappt.",
      {
        "full": "Die letzte vollständige Sicherung wurde {moreThanThreeDaysAgo} ausgeführt.",
        "moreThanThreeDaysAgo": "vor mehr als drei Tagen."
      },
      {
        "full": "Am besten {terminate} Sie die Verbindung und starten sie neu; alternativ können Sie auch den Dienst neu starten.",
        "terminate": "beenden"
      }
    ],
    "success": [
      "Die Sicherung wird gerade erstellt.",
      "Die letzte Sicherungskopie wurde erstellt: {dateTime}"
    ],
    "action": {
      "setUp": "Jetzt konfigurieren",
      "download": "Backup jetzt herunterladen",
      "terminate": "Beenden"
    },
    "alert": {
      "download": "Das Backup läuft jetzt und wird verschlüsselt und auf Ihren Computer geladen. Das wird eine Weile dauern. Sobald der Download begonnen hat, können Sie diese Seite verlassen."
    }
  },
  "es": {
    "getHelp": {
      "full": "Si tiene problemas, pruebe el {forum}.",
      "forum": "foro de la comunidad"
    },
    "notConfigured": [
      "Las copias de seguridad no están configuradas.",
      "El servidor de datos no se ha configurado para hacer una copia de seguridad automática de sus datos en ninguna parte.",
      {
        "full": "A menos que haya configurado algún otro formulario de copia de seguridad de datos que el servidor desconozca, es {recommended} que lo haga ahora. Si no está seguro, lo mejor es hacerlo solo para estar seguro.",
        "recommended": "muy recomendado"
      },
      "Las copias de seguridad automáticas de datos se realizan a través de este sistema una vez al día. Todos sus datos están encriptados con una contraseña que proporcione para que solo usted pueda desbloquearla."
    ],
    "neverRun": [
      "La copia de seguridad configurada aún no se ha ejecutado.",
      "Si ha configurado copias de seguridad en los últimos días, esto es normal. De lo contrario, algo ha salido mal.",
      {
        "full": "En ese caso, las soluciones más probables son {terminate} la conexión y configurarla nuevamente, o reiniciar el servicio.",
        "terminate": "terminar"
      }
    ],
    "somethingWentWrong": [
      "¡Algo está mal!",
      {
        "full": "La última copia de seguridad que se completó correctamente fue {moreThanThreeDaysAgo}.",
        "moreThanThreeDaysAgo": "hace más de tres días"
      },
      {
        "full": "Las soluciones más probables son {terminate} la conexión y configurarla nuevamente, o reiniciar el servicio.",
        "terminate": "terminar"
      }
    ],
    "success": [
      "La copia de seguridad está funcionando",
      "Última copia de seguridad completada con éxito {dateTime}"
    ],
    "action": {
      "setUp": "Configurar ahora",
      "download": "Descargar copia de seguridad ahora",
      "terminate": "Terminar"
    },
    "alert": {
      "download": "La copia de seguridad se está ejecutando ahora y se cifrará y descargará en su computadora. Esto puede tardar un rato. Una vez que comience la descarga, puede salir de esta página"
    }
  },
  "fr": {
    "getHelp": {
      "full": "Si vous rencontrez des difficultés, merci de consulter le {forum}.",
      "forum": "forum de la communauté"
    },
    "notConfigured": [
      "Sauvegarde non configuré",
      "Le serveur de données n'a pas été configuré pour sauvegarder automatiquement ses données.",
      {
        "full": "À moins que vous n'ayez mis en place une autre forme de sauvegarde des données dont le serveur n'a pas connaissance, il est {recommended} de le faire maintenant. Si vous n'êtes pas sûr, il est préférable de le faire juste pour être sûr.",
        "recommended": "fortement recommandé"
      },
      "Les sauvegardes automatiques de données de ce serveur sont quotidiennes. Toutes vos données sont cryptées avec une mot de passe que vous avez fourni de manière à ce que vous seul puissiez les déverrouiller."
    ],
    "neverRun": [
      "La sauvegarde configurée n'a pas encore été lancée.",
      "Si vous avez configuré des sauvegardes au cours des deux derniers jours, c'est normal. Sinon, quelque-chose s'est mal passé.",
      {
        "full": "Dans ce cas, les solutions les plus probables consistent à {terminate} la connexion et à la rétablir, ou à redémarrer le service.",
        "terminate": "terminer"
      }
    ],
    "somethingWentWrong": [
      "Quelque-chose ne va pas.",
      {
        "full": "La dernière sauvegarde correctement terminée était {moreThanThreeDaysAgo}.",
        "moreThanThreeDaysAgo": "plus de trois jours auparavant."
      },
      {
        "full": "Les solutions les plus probables consistent à {terminate} la connexion et à la rétablir, ou à redémarrer le service.",
        "terminate": "terminer"
      }
    ],
    "success": [
      "La sauvegarde fonctionne.",
      "La dernière sauvegarde correctement exécutée {dateTime}."
    ],
    "action": {
      "setUp": "Paramétrer maintenant",
      "download": "Télécharger la sauvegarde maintenant",
      "terminate": "Terminer"
    },
    "alert": {
      "download": "La sauvegarde est en cours, elle sera chiffrée et téléchargée sur votre ordinateur. Cela peut prendre un peu de temps. Une fois démarré le téléchargement, vous pourrez quitter cette page."
    }
  },
  "id": {
    "getHelp": {
      "full": "Apabila Anda memiliki kesulitan, silakan kunjungi {forum}.",
      "forum": "Forum komunitas"
    },
    "notConfigured": [
      "Data cadangan tidak terkonfigurasi.",
      "Server belum diatur untuk melakukan data cadangan otomatis dimanapun.",
      {
        "full": "Apabila Anda belum memiliki pengaturan data cadangan sama sekali, {recommended} Anda mengatur cadangan sekarang demi keamanan data Anda.",
        "recommended": "sangat direkomendasikan"
      },
      "Data cadangan otomatis diproses sistem ini satu kali sehari. Semua data Anda dienkripsi dengan kata sandi yang telah Anda tentukan sehingga hanya Anda yang dapat membukanya."
    ],
    "neverRun": [
      "Data candangan yang dikonfigurasi belum berjalan.",
      "Hal ini adalah normal ppabila Anda memiliki data cadangan yang telah dikonfigurasi dalam beberapa hari terakhir. Jika tidak, terjadi sebuah kesalahan.",
      {
        "full": "Dalam hal ini, saran perbaikan utama adalah dengan {terminate} koneksi dan mengaturnya ulang, atau dengan mengatur ulang servis.",
        "terminate": "memutus"
      }
    ],
    "somethingWentWrong": [
      "Terjadi kesalahan!",
      {
        "full": "Data cadangan terakhir yang sukses dibuat adalah {moreThanThreeDaysAgo}.",
        "moreThanThreeDaysAgo": "lebih dari tiga hari yang lalu"
      },
      {
        "full": "Saran perbaikan utama adalah dengan {terminate} koneksi dan mengaturnya ulang, atau mengatur ulang servis.",
        "terminate": "memutus"
      }
    ],
    "success": [
      "Data cadangan telah berfungsi.",
      "Data cadangan terakhir telah sukses dibuat {dateTime}."
    ],
    "action": {
      "setUp": "Atur sekarang",
      "download": "Unduh cadangan sekarang",
      "terminate": "Putuskan"
    },
    "alert": {
      "download": "Pencadangan sedang berlangsung dan akan dienkripsi selanjutnya diunduh ke komputermu. Perlu waktu beberapa saat. Saat pengunduhan dimulai, kamu bisa meninggalkan laman ini."
    }
  },
  "it": {
    "getHelp": {
      "full": "Se hai problemi, consulta il {forum}.",
      "forum": "forum comunitario"
    },
    "notConfigured": [
      "I backup non sono configurati.",
      "Il server di dati non è stato configurato per eseguire automaticamente il backup dei dati da nessuna parte.",
      {
        "full": "A meno che tu non abbia impostato un'altra forma di backup dei dati di cui il server non è a conoscenza, è {recommended} farlo ora. Se non sei sicuro, è meglio farlo solo per essere al sicuro.",
        "recommended": "fortemente raccomandato"
      },
      "I backup automatici dei dati vengono eseguiti tramite questo sistema una volta al giorno. Tutti i tuoi dati sono crittografati con una password che fornisci in modo che solo tu possa accedervi."
    ],
    "neverRun": [
      "Il backup configurato non è ancora stato eseguito.",
      "Se hai configurato i backup negli ultimi due giorni, è normale. Altrimenti qualcosa è andato storto.",
      {
        "full": "In tal caso, le soluzioni più probabili sono {terminate} la connessione e configurarla di nuovo o riavviare il servizio.",
        "terminate": "terminare"
      }
    ],
    "somethingWentWrong": [
      "Qualcosa non funziona!",
      {
        "full": "L'ultimo backup completato con successo è stato {moreThanThreeDaysAgo}.",
        "moreThanThreeDaysAgo": "più di tre giorni fa"
      },
      {
        "full": "Le soluzioni più probabili sono {terminate} la connessione e configurarla di nuovo o riavviare il servizio.",
        "terminate": "terminare"
      }
    ],
    "success": [
      "Il Backup sta funzionando.",
      "L'ultimo backup è stato completato con successo {dateTime}."
    ],
    "action": {
      "setUp": "Configura adesso",
      "download": "Scarica il backup ora",
      "terminate": "Terminare"
    },
    "alert": {
      "download": "Il backup è ora in esecuzione e verrà crittografato e scaricato sul tuo computer. L'operazione potrebbe richiedere del tempo. Una volta avviato il download, puoi lasciare questa pagina."
    }
  },
  "ja": {
    "getHelp": {
      "full": "問題がある場合、{forum}を確認して下さい。",
      "forum": "コミュニティーフォーラム"
    },
    "notConfigured": [
      "バックアップは設定されていません。",
      "データサーバは自動バックアップの設定をされていません。",
      {
        "full": "他の方法でデータをバックアップしている場合を除き、今すぐバックアップすることを{recommended}。確信が持てない場合は、安全のために設定することが望ましいです。",
        "recommended": "強く推奨します"
      },
      "自動バックアップは本システム経由で毎日行われます。全てのデータは、あなたが設定したパスワードで暗号化されバックアップされ、あなたによって復号が可能です。"
    ],
    "neverRun": [
      "設定されたバックアップは未実行です。",
      "ここ数日の間にバックアップの設定をしたのならば、これは正常です。そうでない場合は、何か問題が起きています。",
      {
        "full": "その場合、最も可能性の高い対処法は、Googleとの連携を{terminate}し、再設定することです。もしくは、サービスを再起動することです。",
        "terminate": "切断"
      }
    ],
    "somethingWentWrong": [
      "何か問題があります！",
      {
        "full": "最終のバックアップは、{moreThanThreeDaysAgo}に正常に完了しています。",
        "moreThanThreeDaysAgo": "3日以上前"
      },
      {
        "full": "最も可能性の高い対処法は、Googleとの連携を{terminate}して再度設定することです。または、サービスを再起動することです。",
        "terminate": "切断"
      }
    ],
    "success": [
      "バックアップしています。",
      "{dateTime}に最新のバックアップは成功しています。"
    ],
    "action": {
      "setUp": "今すぐ設定",
      "download": "今すぐバックアップをダウンロード",
      "terminate": "停止"
    },
    "alert": {
      "download": "現在、バックアップが実行中です。バックアップデータは暗号化され、あなたのコンピュータにダウンロードされます。処理にしばらく時間がかかります。ダウンロードが始まると、このページを閉じても構いません。"
    }
  }
}
</i18n>
