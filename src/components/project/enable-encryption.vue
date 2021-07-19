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
  <modal id="project-enable-encryption" :state="state"
    :hideable="!awaitingResponse" backdrop
    @hide="$emit(success ? 'success' : 'hide')">
    <template #title>{{ $t('title') }}</template>
    <template #body>
      <template v-if="step === 0">
        <div class="modal-introduction">
          <div class="info-block">
            <p>{{ $t('steps[0].introduction[0][0]') }}</p>
            <div class="info-item">
              <span class="icon-check"></span>
              <p>{{ $t('steps[0].introduction[0][1]') }}</p>
            </div>
            <div class="info-item">
              <span class="icon-check"></span>
              <p>{{ $t('steps[0].introduction[0][2]') }}</p>
            </div>
            <div class="info-item">
              <span class="icon-circle-o"></span>
              <i18n tag="p" path="steps[0].introduction[0][3][0]">
                <template #submission>
                  <code>&lt;submission&gt;</code>
                </template>
              </i18n>
              <i18n tag="p" path="steps[0].introduction[0][3][1]">
                <template #base64RsaPublicKey>
                  <code>base64RsaPublicKey</code>
                </template>
              </i18n>
            </div>
            <div class="info-item">
              <span class="icon-close"></span>
              <p>{{ $t('steps[0].introduction[0][4]') }}</p>
            </div>
            <div class="info-item">
              <span class="icon-close"></span>
              <p>{{ $t('steps[0].introduction[0][5]') }}</p>
            </div>
            <div class="info-item">
              <span class="icon-close"></span>
              <p>{{ $t('steps[0].introduction[0][6]') }}</p>
            </div>
          </div>
          <div class="info-block">
            <p>{{ $t('steps[0].introduction[1][0]') }}</p>
            <div class="info-item">
              <span class="icon-circle-o"></span>
              <p>{{ $t('steps[0].introduction[1][1][0]') }}</p>
              <p>{{ $t('steps[0].introduction[1][1][1]') }}</p>
            </div>
            <div class="info-item">
              <span class="icon-close"></span>
              <p>{{ $t('steps[0].introduction[1][2][0]') }}</p>
              <p>{{ $t('steps[0].introduction[1][2][1]') }}</p>
            </div>
          </div>
          <i18n tag="p" path="steps[0].introduction[2].full">
            <template #here>
              <doc-link to="central-encryption/">{{ $t('steps[0].introduction[2].here') }}</doc-link>
            </template>
          </i18n>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-primary" @click="moveToForm">
            {{ $t('action.next') }}
          </button>
          <button type="button" class="btn btn-link" @click="$emit('hide')">
            {{ $t('action.neverMind') }}
          </button>
        </div>
      </template>
      <template v-else-if="step === 1">
        <div class="modal-introduction">
          <p>{{ $t('steps[1].introduction[0]') }}</p>
          <i18n tag="p" path="steps[1].introduction[1].full">
            <template #no>
              <strong>{{ $t('steps[1].introduction[1].no') }}</strong>
            </template>
          </i18n>
        </div>
        <form @submit.prevent="submit">
          <form-group ref="passphrase" v-model="passphrase"
            :placeholder="$t('field.passphrase')" required autocomplete="off"
            strengthmeter/>
          <form-group v-model="hint" :placeholder="$t('field.hint')"
            autocomplete="off"/>
          <div class="modal-actions">
            <button type="submit" class="btn btn-primary"
              :disabled="awaitingResponse">
              {{ $t('action.next') }} <spinner :state="awaitingResponse"/>
            </button>
            <button type="button" class="btn btn-link"
              :disabled="awaitingResponse" @click="$emit('hide')">
              {{ $t('action.neverMind') }}
            </button>
          </div>
        </form>
      </template>
      <template v-else>
        <p id="project-enable-encryption-success-icon-container">
          <span class="icon-check-circle"></span>
        </p>
        <p class="modal-introduction">
          <strong>{{ $t('common.success') }}</strong>
          <sentence-separator/>
          <span>{{ $t('steps[2].introduction[0]') }}</span>
        </p>
        <div class="modal-actions">
          <button type="button" class="btn btn-primary"
            @click="$emit('success')">
            {{ $t('action.done') }}
          </button>
        </div>
      </template>
    </template>
  </modal>
</template>

<script>
import DocLink from '../doc-link.vue';
import FormGroup from '../form-group.vue';
import Modal from '../modal.vue';
import SentenceSeparator from '../sentence-separator.vue';
import Spinner from '../spinner.vue';

import request from '../../mixins/request';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
import { requestData } from '../../store/modules/request';

export default {
  name: 'ProjectEnableEncryption',
  components: { DocLink, FormGroup, Modal, SentenceSeparator, Spinner },
  mixins: [request()],
  props: {
    state: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      awaitingResponse: false,
      // The step in the wizard
      step: 0,
      passphrase: '',
      hint: '',
      success: false
    };
  },
  computed: requestData(['project']),
  watch: {
    state() {
      if (this.state) return;
      this.step = 0;
      this.passphrase = '';
      this.hint = '';
      this.success = false;
    }
  },
  methods: {
    moveToForm() {
      this.step += 1;
      this.$nextTick(() => {
        this.$refs.passphrase.focus();
      });
    },
    submit() {
      const data = { passphrase: this.passphrase };
      if (this.hint !== '') data.hint = this.hint;
      this.post(apiPaths.projectKey(this.project.id), data)
        .then(() => {
          this.step += 1;
          this.success = true;
        })
        .catch(noop);
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#project-enable-encryption {
  .info-block {
    margin-bottom: 10px;
  }

  .info-item {
    position: relative;

    span {
      left: 3px;
      position: absolute;

      &.icon-check {
        color: $color-success;
      }

      &.icon-close {
        color: $color-danger;
      }

      &.icon-circle-o {
        color: #999;
        top: 1px;
      }
    }

    p {
      margin-bottom: 6px;
      margin-left: 21px;

      + p {
        font-size: 12px;
        margin-top: -3px;
      }

      code {
        background-color: transparent;
        color: $color-text;
        padding: 0;
      }
    }
  }
}

#project-enable-encryption-success-icon-container {
  color: $color-success;
  font-size: 84px;
  line-height: 1;
  text-align: center;
}
</style>

<i18n lang="json5">
{
  "en": {
    // This is the title at the top of a pop-up.
    "title": "Enable Encryption",
    "steps": [
      {
        "introduction": [
          [
            "If you enable encryption, the following things will happen:",
            "Finalized Submission data will be encrypted on mobile devices.",
            "Submission data at rest will be encrypted on the Central server.",
            [
              // {submission} will have the text "<submission>", which is XML
              // and will not be translated.
              "Forms configured with manual {submission} keys will continue to use those keys, and must be manually decrypted.",
              // {base64RsaPublicKey} will have the text "base64RsaPublicKey",
              // which is code and will not be translated.
              "To use the automatic Central encryption process on these Forms, remove the {base64RsaPublicKey} configuration."
            ],
            "You will no longer be able to preview Submission data online.",
            "You will no longer be able to connect to data over OData.",
            "You will no longer be able to edit Submissions in your web browser."
          ],
          [
            "In addition, the following are true in this version of ODK Central:",
            [
              "Existing Submissions will remain unencrypted.",
              "In a future version, you will have the option to encrypt existing data."
            ],
            [
              "Encryption cannot be turned off once enabled.",
              "In a future version, you will be able to disable encryption, which will decrypt your data. This will be true even if you enable encryption now."
            ]
          ],
          {
            "full": "You can learn more about encryption {here}. If this sounds like something you want, press Next to proceed.",
            "here": "here"
          }
        ]
      },
      {
        "introduction": [
          "First, you will need to choose a passphrase. This passphrase will be required to decrypt your Submissions. For your privacy, the server will not remember this passphrase: only people with the passphrase will be able to decrypt and read your Submission data.",
          {
            "full": "There are no length or content restrictions on the passphrase, but if you lose it, there is {no} way to recover it or your data!",
            "no": "no"
          }
        ]
      },
      {
        "introduction": [
          "Encryption has been configured for this Project. Any mobile devices will have to fetch or refetch the latest Forms for encryption to take place."
        ]
      }
    ],
    "field": {
      "hint": "Passphrase hint (optional)"
    }
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "title": "Povolit šifrování",
    "steps": [
      {
        "introduction": [
          [
            "Pokud povolíte šifrování, stanou se následující věci:",
            "Dokončená data k odesílání budou šifrována na mobilních zařízeních.",
            "Data k odesílání budou nakonec šifrována na centrálním serveru.",
            [
              "Formuláře nakonfigurované pomocí ručně {submission} klíčů budou tyto klíče nadále používat a musí být ručně dešifrovány.",
              "Chcete-li použít automatický proces centrálního šifrování na těchto formulářích, odeberte konfiguraci {base64RsaPublicKey}."
            ],
            "Již nebudete mít možnost zobrazit online náhled odeslaných údajů.",
            "Již se nebudete moci připojit k datům přes OData.",
            "Ve svém webovém prohlížeči již nebudete moci upravovat příspěvky."
          ],
          [
            "Kromě toho platí pro tuto verzi ODK Central následující:",
            [
              "Stávající příspěvky zůstanou nezašifrované.",
              "V budoucí verzi budete mít možnost šifrovat stávající data."
            ],
            [
              "Po aktivaci nelze šifrování vypnout.",
              "V budoucí verzi budete moci zakázat šifrování, které dešifruje vaše data. To bude platit, i když nyní povolíte šifrování."
            ]
          ],
          {
            "full": "{here} se dozvíte více o šifrování. Pokud to zní jako něco, co chcete, pokračujte stisknutím tlačítka Další.",
            "here": "zde"
          }
        ]
      },
      {
        "introduction": [
          "Nejprve si musíte zvolit přístupové heslo. Toto heslo bude vyžadováno k dešifrování vašich příspěvků. Server si toto heslo nebude pamatovat z důvodu vašeho soukromí: pouze lidé s přístupovým slovem budou moci dešifrovat a přečíst vaše údaje o odeslání.",
          {
            "full": "Na přístupová hesla neexistují žádná omezení délky ani obsahu, ale pokud je ztratíte, neexistuje {no} způsob, jak je obnovit, nebo jak obnovit vaše data!",
            "no": "žádný"
          }
        ]
      },
      {
        "introduction": [
          "Pro tento projekt bylo nakonfigurováno šifrování. K provedení šifrování bude muset mobilní zařízení načíst, nebo znovu načíst nejnovější formuláře."
        ]
      }
    ],
    "field": {
      "hint": "Přístupová fráze (volitelné)"
    }
  },
  "de": {
    "title": "Verschlüsselung aktivieren",
    "steps": [
      {
        "introduction": [
          [
            "Wenn Sie die Verschlüsselung aktivieren, wird folgendes geschehen:",
            "Daten von abgeschlossenen Übermittlungen werden auf den Mobilgeräten verschlüsselt.",
            "Übermittlungen auf dem Central Server werden verschlüsselt.",
            [
              "Formulare, die mit manuellen {submission} Schlüsseln konfiguriert wurden, werden diese Schlüssel weiterhin verwenden und müssen manuell entschlüsselt werden.",
              "Um den automatischen Central-Verschlüsselungsprozess für diese Formulare zu nutzen, entfernen Sie die {base64RsaPublicKey} Konfiguration."
            ],
            "Sie werden zukünftig Übermittlungsdaten nicht mehr online als Vorschau sehen können.",
            "Sie werden sich zukünftig nicht mehr über OData mit Daten verbinden können.",
            "Sie können Übermittlungen nicht mehr in ihrem Webbrowser bearbeiten."
          ],
          [
            "Außerdem treffen die folgenden Punkte in dieser Version von ODK Central zu:",
            [
              "Existierende Übermittlungen bleiben unverschlüsselt.",
              "In einer zukünftigen Version werden Sie die Option haben existierende Daten zu verschlüsseln."
            ],
            [
              "Verschlüsselung kann nicht deaktiviert werden, nachdem es einmal aktiviert wurde.",
              "In einer zukünftigen Version werden Sie Verschlüsselung deaktivieren können, was ihre Daten entschlüsseln wird. Dies trifft auch zu, wenn Sie Verschlüsselung jetzt aktivieren."
            ]
          ],
          {
            "full": "Sie können {here} mehr über Verschlüsselung erfahren. Wenn sich das wollen, klicken Sie auf Weiter, um fortzufahren.",
            "here": "hier"
          }
        ]
      },
      {
        "introduction": [
          "Zuerst müssen Sie eine Passphrase auswählen. Diese wird dann benötigt, um Ihre Übermittlungen zu entschlüsseln. Zum Schutz Ihrer Daten wird diese Passphrase nicht gespeichert. Nur Benutzer, die diese Passphrase wissen, können Ihre Übermittlungen entschlüsseln.",
          {
            "full": "Passphrasen haben keine Längen- oder Inhaltsbeschränkungen. Es gibt {no} Möglichkeit eine verlorene Passphrase wiederherzustellen!",
            "no": "keine"
          }
        ]
      },
      {
        "introduction": [
          "Für dieses Projekt wurde Verschlüsselung aktiviert. Alle Mobilgeräte müssen die neuesten Formulare herunterladen damit die Verschlüsselung auch durchgeführt wird."
        ]
      }
    ],
    "field": {
      "hint": "Optionale Merkhilfe für die Passphrase"
    }
  },
  "es": {
    "title": "Habilitar el cifrado",
    "steps": [
      {
        "introduction": [
          [
            "Si usted habilita el cifrado, ocurrirán las siguientes cosas:",
            "Los datos de la presentación final serán cifrados en los dispositivos móviles.",
            "Los datos de la presentación que se encuentran en reposo serán cifrados en el servidor Central.",
            [
              "Los formularios configurados con claves {submission} manuales continuarán utilizando esas claves y deben ser descifrados manualmente.",
              "Para utilizar el proceso automático de encriptación de Central en estos formularios, remueva la configuración {base64RsaPublicKey}."
            ],
            "Ya no podrá obtener una vista previa de los datos de la presentación en línea",
            "Ya no podrá conectarse a los datos a través de Odata.",
            "Ya no podrá editar envíos en su navegador web."
          ],
          [
            "Además, lo siguiente es cierto en esta versión de ODK Central:",
            [
              "Los envíos existentes permanecerán sin cifrar.",
              "En una futura versión, tendrá la opción de cifrar los datos existentes."
            ],
            [
              "El cifrado no podrá ser desactivado una vez activado.",
              "En una versión futura, usted podrá desactivar el cifrado, que permitirá descifrar sus datos. Esto será efectivo incluso si habilita el cifrado ahora."
            ]
          ],
          {
            "full": "Puede obtener más información sobre el cifrado {here}. Si esto suena como algo que desea hacer, presione siguiente para continuar.",
            "here": "aquí"
          }
        ]
      },
      {
        "introduction": [
          "En primer lugar, necesitará seleccionar una frase de contraseña. Esta frase será requerida para descifrar sus envíos. Por su privacidad, el servidor no recordará esta frase: solo las personas con la frase de contraseña podrán descifrar y leer los datos de sus envíos.",
          {
            "full": "No hay restricciones de longitud o de contenido para la frase de contraseña, pero si usted la pierde, {no} habrá forma de recuperarla ni a sus datos!",
            "no": "no"
          }
        ]
      },
      {
        "introduction": [
          "El cifrado ha sido configurado para este proyecto. Cualquier dispositivo móvil tendrá que buscar o volver a buscar los últimos formularios para que el cifrado se lleve a cabo."
        ]
      }
    ],
    "field": {
      "hint": "Sugerencia de frase de contraseña (opcional)"
    }
  },
  "fr": {
    "title": "Activer le chiffrement",
    "steps": [
      {
        "introduction": [
          [
            "Si vous activez le chiffrement, les choses suivantes vont se produire :",
            "Les données de soumission finalisées seront chiffrées sur les appareils mobiles.",
            "Les données de soumission au repos seront chiffrées sur le serveur de Central.",
            [
              "Les formulaires configurés avec des clés {submission} manuelles continueront à utiliser ces clés et devront être déchiffrés manuellement.",
              "Pour utiliser le chiffrement automatique de Central pour ce formulaire, supprimez la configuration {base64RsaPublicKey}."
            ],
            "Vous ne pourrez plus prévisualiser les données de soumission en ligne.",
            "Vous ne pourrez plus vous connecter aux données via OData.",
            "Vous ne serez plus en mesure d'éditer les soumissions dans votre navigateur."
          ],
          [
            "En outre, ce qui suit est vrai dans cette version d'ODK Central :",
            [
              "Les soumissions existantes resteront non chiffrées.",
              "Dans une prochaine version, vous aurez la possibilité de chiffrer les données existantes."
            ],
            [
              "Le chiffrement ne peut pas être désactivé une fois qu'il est activé.",
              "Dans une prochaine version, vous pourrez désactiver le chiffrement, ce qui permettra de déchiffrer vos données. Ce sera le cas même si vous activez le chiffrement maintenant."
            ]
          ],
          {
            "full": "Vous pouvez en apprendre plus sur le chiffrement en cliquant {here}. Si il vous semble être utile, cliquez sur Suivant pour procéder.",
            "here": "ici"
          }
        ]
      },
      {
        "introduction": [
          "Tout d'abord vous devrez choisir une phrase de passe. Elle sera requise pour déchiffrer vos données soumises. Pour respecter votre vie privée, le serveur ne retiendra pas cette phrase de passe : seules les personnes disposant de la phrase de passe pourront déchiffrer et lire vos données envoyées.",
          {
            "full": "La phrase secrète n'est soumise à aucune restriction de longueur ou de contenu, mais si vous la perdez, il n'y a {no} moyen de la récupérer, ni de récupérer vos données !",
            "no": "non"
          }
        ]
      },
      {
        "introduction": [
          "Le chiffrement a été configuré pour ce projet. Tout appareil mobile devra aller récupérer ou aller récupérer à nouveau les derniers formulaires pour que le chiffrement puisse avoir lieu."
        ]
      }
    ],
    "field": {
      "hint": "Indice de phrase de passe (optionnel)"
    }
  },
  "id": {
    "title": "Izinkan Enkripsi",
    "steps": [
      {
        "introduction": [
          [],
          [
            "Sebagai tambahan, berikut adalah yang benar ada pada versi ODK Central ini:",
            [
              "Kiriman data yang sudah ada akan tetap tidak terenkripsi.",
              "Pada versi yang akan datang, Anda akan memiliki pilihan untuk mengenkripsi data yang sudah ada."
            ],
            [
              "Enkripsi tidak dapat dimatikan setelah diizinkan.",
              "Pada versi yang akan datang, Anda akan bisa menonaktifkan enkripsi, yang mana akan mendekripsi data Anda. Ini akan terjadi bahkan apabila Anda mengizinkan enkripsi sekarang."
            ]
          ],
          {
            "full": "Anda dapat mempelajari lebih banyak tentang enkripsi {here}. Apabila ini terdengar seperti sesuatu yang Anda inginkan, tekan \"Berikutnya\" untuk melanjutkan.",
            "here": "di sini"
          }
        ]
      },
      {
        "introduction": [
          "Pertama-tama, Anda harus memilih sebuah frasa sandi. Frasa sandi ini akan dibutuhkan untuk mendekripsi kiriman data Anda. Demi pribasi Anda, server tidak akan bisa mengingat frasa sandi ini: hanya orang yang mengetahui frasa sandi yang dapat mendekripsi dan membaca kiriman data Anda.",
          {
            "full": "Tidak ada batas panjang atau larangan konten pada frasa sandi, namun apabila Anda kehilangan/lupa, {no} cara untuk mengembalikan frasa sandi maupun data Anda!",
            "no": "tidak ada"
          }
        ]
      },
      {
        "introduction": [
          "Enkripsi telah dikonfigurasi untuk Proyek ini. Setiap perangkat seluler harus mengambil ulang formulir terbaru untuk mengaktifkan enkripsi."
        ]
      }
    ],
    "field": {
      "hint": "Petunjuk frasa sandi (opsional)"
    }
  },
  "it": {
    "title": "Abilita crittografia",
    "steps": [
      {
        "introduction": [
          [
            "Se abiliti la crittografia, accadranno le seguenti cose:",
            "I dati dell'Invio finalizzato verranno crittografati sui dispositivi mobili.",
            "I dati inattivi di invio verranno crittografati sul server Central.",
            [
              "I formulari configurati con chiavi {submission} manuali continueranno a utilizzare tali chiavi e devono essere decrittografati manualmente.",
              "Per utilizzare il processo di crittografia centrale automatica su questi formulari, rimuovere la configurazione {base64RsaPublicKey}."
            ],
            "Non sarai più in grado di visualizzare in anteprima i dati di invio online.",
            "Non sarai più in grado di connetterti ai dati tramite OData.",
            "Non sarai più in grado di modificare gli Invii nel tuo browser web."
          ],
          [
            "Inoltre, quanto segue è reale in questa versione di ODK Central:",
            [
              "Gli invii esistenti rimarranno non crittografati.",
              "In una versione futura, avrai la possibilità di crittografare i dati esistenti."
            ],
            [
              "La crittografia non può essere disattivata una volta abilitata.",
              "In una versione futura, sarai in grado di disabilitare la crittografia, che decrittograferà i tuoi dati. Questo sarà possibile anche se abiliti la crittografia ora."
            ]
          ],
          {
            "full": "Puoi imparare di più sulla crittografia {here}. Se questo è quello che desideri, premi Avanti per procedere.",
            "here": "qui"
          }
        ]
      },
      {
        "introduction": [
          "Innanzitutto, dovrai scegliere una passphrase. Questa passphrase sarà necessaria per decifrare i tuoi Invii. Per la tua privacy, il server non ricorderà questa passphrase: solo le persone con la passphrase saranno in grado di decifrare e leggere i tuoi dati di invio.",
          {
            "full": "Non ci sono restrizioni sulla lunghezza o sul contenuto della passphrase, ma se la perdi, {no} c'è un modo per recuperarla o recuperare i tuoi dati!",
            "no": "no"
          }
        ]
      },
      {
        "introduction": [
          "La crittografia è stata configurata per questo progetto. Tutti i dispositivi mobili dovranno prendere o recuperare i formulari più recenti affinché la crittografia possa avvenire."
        ]
      }
    ],
    "field": {
      "hint": "Suggerimento per la passphrase (opzionale)"
    }
  },
  "ja": {
    "title": "暗号化を有効にする",
    "steps": [
      {
        "introduction": [
          [
            "暗号化を有効にすると、次のようになります。",
            "確定済フォームは、モバイル端末の内部で暗号化されます。",
            "提出済フォームはCentralサーバーで暗号化されます。",
            [
              "手動で{submission}キーを設定したフォームでは、そのキーが引き続き使用されるため、手動で復号化する必要があります。",
              "これらのフォームでCentralの自動暗号化処理を使用するには、{base64RsaPublicKey}の設定を削除して下さい。"
            ],
            "オンラインで提出済フォームのデータをプレビューできなくなります。",
            "OData経由でデータに接続できなくなります。",
            "提出されたデータをWebブラウザで編集できなくなります。"
          ],
          [
            "また、このバージョンのODK Centralでは以下のようになっています。",
            [
              "既存の提出されたフォームは暗号化されずに残ります。",
              "今後のバージョンでは、既存のデータを暗号化するオプションが追加される予定です。"
            ],
            [
              "一度有効にされた暗号化を無効にすることはできません。",
              "今後のバージョンでは、暗号化を無効にするとデータが復号化されます。これは現時点で暗号化を有効にしていても同様です。"
            ]
          ],
          {
            "full": "暗号化についての詳細は{here}にあります。この内容でよろしければ、「次へ」をクリックして次に進みます。",
            "here": "こちら"
          }
        ]
      },
      {
        "introduction": [
          "まず、あなたはパスフレーズを設定する必要があります。このパスフレーズは、あなたの提出済フォームを復号する際に求められます。あなたのプライバシーを保護するため、サーバーはパスフレーズを記録しません。設定されたパスフレーズを知っている者のみがあなたの提出済フォームデータを復号できます。",
          {
            "full": "パスフレーズの長さや文字に関して、制限はありません。もしパスフレーズを忘れた場合、パスフレーズまたはデータの復元方法はあり{no}。",
            "no": "ません"
          }
        ]
      },
      {
        "introduction": [
          "このプロジェクトでは、暗号化が設定されています。モバイル端末で暗号化を行うためには、最新のフォームを取得または再取得する必要があります。"
        ]
      }
    ],
    "field": {
      "hint": "パスフレーズのヒント（任意）"
    }
  }
}
</i18n>
