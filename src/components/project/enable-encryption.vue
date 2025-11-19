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
              <i18n-t tag="p" keypath="steps[0].introduction[0][3][0]">
                <template #submission>
                  <code>&lt;submission&gt;</code>
                </template>
              </i18n-t>
              <i18n-t tag="p" keypath="steps[0].introduction[0][3][1]">
                <template #base64RsaPublicKey>
                  <code>base64RsaPublicKey</code>
                </template>
              </i18n-t>
            </div>
            <div class="info-item">
              <span class="icon-circle-o"></span>
              <p>{{ $t('steps[0].introduction[1][1][0]') }}</p>
            </div>
            <div class="info-item">
              <span class="icon-circle-o"></span>
              <p>{{ $t('steps[0].introduction[1][3]') }} </p>
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
            <div class="info-item">
              <span class="icon-close"></span>
              <p>{{ $t('steps[0].introduction[0][7]') }}</p>
            </div>
            <div class="info-item">
              <span class="icon-close"></span>
              <p>{{ $t('steps[0].introduction[1][2][0]') }}</p>
            </div>
          </div>
          <i18n-t tag="p" keypath="steps[0].introduction[2].full">
            <template #here>
              <doc-link to="central-encryption/">{{ $t('steps[0].introduction[2].here') }}</doc-link>
            </template>
          </i18n-t>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-link" @click="$emit('hide')">
            {{ $t('action.neverMind') }}
          </button>
          <button type="button" class="btn btn-primary" @click="moveToForm">
            {{ $t('action.next') }}
          </button>
        </div>
      </template>
      <template v-else-if="step === 1">
        <div class="modal-introduction">
          <p>{{ $t('steps[1].introduction[0]') }}</p>
          <i18n-t tag="p" keypath="steps[1].introduction[1].full">
            <template #no>
              <strong>{{ $t('steps[1].introduction[1].no') }}</strong>
            </template>
          </i18n-t>
        </div>
        <form @submit.prevent="submit">
          <form-group ref="passphrase" v-model="passphrase"
            :placeholder="$t('field.passphrase')" required
            autocomplete="new-password"/>
          <form-group v-model="hint" :placeholder="$t('field.hint')"
            autocomplete="off"/>
          <div class="modal-actions">
            <button type="button" class="btn btn-link"
              :aria-disabled="awaitingResponse" @click="$emit('hide')">
              {{ $t('action.neverMind') }}
            </button>
            <button type="submit" class="btn btn-danger"
              :aria-disabled="awaitingResponse">
              {{ $t('action.finish') }} <spinner :state="awaitingResponse"/>
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
          <span>{{ $t('success[0]') }}</span>
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

import useRequest from '../../composables/request';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
import { useRequestData } from '../../request-data';

export default {
  name: 'ProjectEnableEncryption',
  components: { DocLink, FormGroup, Modal, SentenceSeparator, Spinner },
  inject: ['redAlert'],
  props: {
    state: {
      type: Boolean,
      default: false
    }
  },
  emits: ['hide', 'success'],
  setup() {
    const { project } = useRequestData();
    const { request, awaitingResponse } = useRequest();
    return { project, request, awaitingResponse };
  },
  data() {
    return {
      // The step in the wizard
      step: 0,
      passphrase: '',
      hint: '',
      success: false
    };
  },
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
      if (this.passphrase.length < 10) {
        this.redAlert.show(this.$t('alert.passphraseTooShort'));
        return;
      }

      const data = { passphrase: this.passphrase };
      if (this.hint !== '') data.hint = this.hint;
      this.request({
        method: 'POST',
        url: apiPaths.projectKey(this.project.id),
        data
      })
        .then(() => {
          this.redAlert.hide();
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
            "You will no longer be able to edit or view Submission data online.",
            "You will no longer be able to analyze data via OData.",
            "You will no longer be able to edit Submissions in your web browser.",
            "New Submissions will no longer be processed into Entities."
          ],
          [
            // don't translate this sentence, it is not used anywhere
            "In addition, the following are true in this version of ODK Central:",
            [
              "Existing Submissions will remain unencrypted."
            ],
            [
              "Encryption cannot be turned off once enabled."
            ],
            "Test Submissions to existing Draft Forms will be permanently removed."
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
            "full": "If you lose the passphrase, there is {no} way to recover it or your data!",
            "no": "no"
          }
        ]
      }
    ],
    "success": [
      "Encryption has been configured for this Project. Any mobile devices will have to fetch or refetch the latest Forms for encryption to take place."
    ],
    "field": {
      "hint": "Passphrase hint (optional)"
    },
    "alert": {
      "passphraseTooShort": "Please input a passphrase at least 10 characters long."
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
            ]
          ],
          [
            "Kromě toho platí pro tuto verzi ODK Central následující:",
            [
              "Stávající příspěvky zůstanou nezašifrované."
            ],
            [
              "Po aktivaci nelze šifrování vypnout."
            ],
            "Testovací odeslání ke stávajícím návrhům formulářů budou trvale odstraněna."
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
            "full": "Pokud ztratíte přístupovou frázi, neexistuje {no} způsob, jak ji nebo svá data obnovit!",
            "no": "žádný"
          }
        ]
      }
    ],
    "success": [
      "Pro tento projekt bylo nakonfigurováno šifrování. Všechna mobilní zařízení budou muset načíst nebo znovu načíst nejnovější Formuláře, aby mohlo dojít k šifrování."
    ],
    "field": {
      "hint": "Přístupová fráze (volitelné)"
    },
    "alert": {
      "passphraseTooShort": "Zadejte alespoň 10 znaků dlouhou přístupovou frázi."
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
            "Sie können die Übermittlungsdaten nicht mehr online bearbeiten oder anschauen.",
            "Sie werden nicht mehr in der Lage sein, Daten über OData zu analysieren.",
            "Sie können Übermittlungen nicht mehr in ihrem Webbrowser bearbeiten.",
            "Neue Einreichungen werden nicht mehr zu Objekte verarbeitet."
          ],
          [
            "Außerdem treffen die folgenden Punkte in dieser Version von ODK Central zu:",
            [
              "Existierende Übermittlungen bleiben unverschlüsselt."
            ],
            [
              "Verschlüsselung kann nicht deaktiviert werden, nachdem es einmal aktiviert wurde."
            ],
            "Testeinsendungen zu bestehenden Formularentwürfen werden dauerhaft entfernt."
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
            "full": "Wenn Sie die Passphrase verlieren, gibt es {no} Möglichkeit, sie oder Ihre Daten wiederherzustellen!",
            "no": "keine"
          }
        ]
      }
    ],
    "success": [
      "Für dieses Projekt wurde Verschlüsselung aktiviert. Alle Mobilgeräte müssen die neuesten Formulare herunterladen damit die Verschlüsselung auch durchgeführt wird."
    ],
    "field": {
      "hint": "Optionale Merkhilfe für die Passphrase"
    },
    "alert": {
      "passphraseTooShort": "Bitte geben Sie eine mindestens 10 Zeichen lange Passphrase ein."
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
            "Ya no podrá editar ni ver los datos de envío en línea.",
            "Ya no podrá analizar datos a través de OData.",
            "Ya no podrá editar envíos en su navegador web.",
            "Los Envíos nuevos ya no se procesarán en Entidades."
          ],
          [
            "Además, lo siguiente es cierto en esta versión de ODK Central:",
            [
              "Los envíos existentes permanecerán sin cifrar."
            ],
            [
              "El cifrado no podrá ser desactivado una vez activado."
            ],
            "Los envíos de prueba a los borradores de formularios existentes se eliminarán de forma permanente."
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
            "full": "Si pierde la frase de contraseña, {no} hay una manera de recuperarla o sus datos!",
            "no": "no"
          }
        ]
      }
    ],
    "success": [
      "El cifrado ha sido configurado para este proyecto. Cualquier dispositivo móvil tendrá que buscar o volver a buscar los últimos formularios para que el cifrado se lleve a cabo."
    ],
    "field": {
      "hint": "Sugerencia de frase de contraseña (opcional)"
    },
    "alert": {
      "passphraseTooShort": "Ingrese una frase de contraseña de al menos 10 caracteres."
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
            "Vous ne pourrez plus éditer ou prévisualiser les données de soumission en ligne.",
            "Vous ne pourrez plus vous connecter aux données via OData.",
            "Vous ne serez plus en mesure d'éditer les soumissions dans votre navigateur.",
            "Les nouvelles Soumissions ne seront plus transformées en entités."
          ],
          [
            "En outre, ce qui suit est vrai dans cette version d'ODK Central :",
            [
              "Les soumissions existantes resteront non chiffrées."
            ],
            [
              "Le chiffrement ne peut pas être désactivé une fois qu'il est activé."
            ],
            "Les soumissions de test des ébauches de formulaires existantes seront définitivement supprimées."
          ],
          {
            "full": "Vous pouvez en apprendre plus à propos du chiffrement en cliquant {here}. Si cela vous semble être utile, cliquez sur Suivant pour continuer.",
            "here": "ici"
          }
        ]
      },
      {
        "introduction": [
          "Tout d'abord vous devrez choisir une phrase de passe. Elle sera requise pour déchiffrer vos données soumises. Pour respecter votre vie privée, le serveur ne retiendra pas cette phrase de passe : seules les personnes disposant de la phrase de passe pourront déchiffrer et lire vos données envoyées.",
          {
            "full": "Si vous perdez la phrase de passe, il n'y a pas {no} de moyen de recouvrer vos données !",
            "no": "non"
          }
        ]
      }
    ],
    "success": [
      "Le chiffrement a été configuré pour ce projet. Tous les appareils mobiles devront récupérer ou rerécupérer les derniers formulaires pour que le chiffrement puisse avoir lieu."
    ],
    "field": {
      "hint": "Indice de phrase de passe (optionnel)"
    },
    "alert": {
      "passphraseTooShort": "Merci de renseigner une phrase secrète d'au moins 10 caractères."
    }
  },
  "id": {
    "title": "Izinkan Enkripsi",
    "steps": [
      {
        "introduction": [
          [
            "Apabila Anda mengizinkan enkripsi, hal-hal berikut akan terjadi:",
            "Kiriman data yang sudah difinalisasi akan dienkripsi di perangkat seluler.",
            "Kiriman data lain akan dienkripsi di server Central.",
            [
              "Formulir yang dikonfigurasi dengan kunci {submission} manual akan tetap menggunakan kunci-kunci tersebut dan harus didekripsi secara manual.",
              "Untuk menggunakan proses enkripsi otomatis Central pada formulir ini, hapus konfigurasi {base64RsaPublicKey}."
            ]
          ],
          [
            "Sebagai tambahan, berikut adalah yang benar ada pada versi ODK Central ini:",
            [
              "Kiriman data yang sudah ada akan tetap tidak terenkripsi."
            ],
            [
              "Enkripsi tidak dapat dimatikan setelah diizinkan."
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
          {}
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
            "Non sarai più in grado di modificare i dati di invio online.",
            "Non sarai più in grado di analizzare dati tramite OData.",
            "Non sarai più in grado di modificare gli Invii nel tuo browser web.",
            "I nuovi invii non verranno più elaborati in Entità."
          ],
          [
            "Inoltre, quanto segue è reale in questa versione di ODK Central:",
            [
              "Gli invii esistenti rimarranno non crittografati."
            ],
            [
              "La crittografia non può essere disattivata una volta abilitata."
            ],
            "Gli invii di prova ai moduli bozza esistenti verranno rimossi definitivamente."
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
            "full": "If you lose the passphrase, there is {no} modo per recuperarlo oi tuoi dati!",
            "no": "no"
          }
        ]
      }
    ],
    "success": [
      "La crittografia è stata configurata per questo progetto. Tutti i dispositivi mobili dovranno prendere o recuperare i formulari più recenti affinché la crittografia possa avvenire."
    ],
    "field": {
      "hint": "Suggerimento per la passphrase (opzionale)"
    },
    "alert": {
      "passphraseTooShort": "Inserisci una passphrase di almeno 10 caratteri."
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
            ]
          ],
          [
            "また、このバージョンのODK Centralでは以下のようになっています。",
            [
              "既存の提出されたフォームは暗号化されずに残ります。"
            ],
            [
              "一度有効にされた暗号化を無効にすることはできません。"
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
          {}
        ]
      }
    ],
    "field": {
      "hint": "パスフレーズのヒント（任意）"
    },
    "alert": {
      "passphraseTooShort": "パスフレーズを10文字以上で入力してください。"
    }
  },
  "pt": {
    "title": "Habilitar encriptação",
    "steps": [
      {
        "introduction": [
          [
            "Se você habilitar a encriptação, ocorrerá o seguinte:",
            "Dados de respostas finalizadas serão encriptados nos dispositivos móveis.",
            "Dados de respostas atualmente armazenados nesse servidor Central serão criptografados.",
            [
              "Formulários configurados com chaves manuais de encriptação {submission} continuarão a utilizar essas chaves e precisarão ser descriptografados manualmente.",
              "Para usar o processo de encriptação automático do Central nesses formulários, remova a configuração da chave {base64RsaPublicKey}."
            ],
            "Você não poderá mais editar ou visualizar dados de Resposta on-line.",
            "Você não poderá mais analisar dados via OData.",
            "Você não poderá mais editar respostas no seu navegador de internet.",
            "Novas Respostas não serão mais processadas em Entidades."
          ],
          [
            "Além disso, as informações a seguir são verdadeiras nessa versão do ODK Central:",
            [
              "As respostas existentes permanecerão sem encriptação."
            ],
            [
              "A encriptação não poderá ser desligada uma vez que tenha sido habilitada."
            ],
            "Respostas de teste para Rascunhos de Formulários existentes serão removidos permanentemente."
          ],
          {
            "full": "Você pode aprender mais sobre encriptação {here}. Se isso soa como algo que você deseja, pressione próximo para continuar.",
            "here": "aqui"
          }
        ]
      },
      {
        "introduction": [
          "Primeiro, você precisará escolher uma senha longa. Esta senha será necessária para descriptografar suas respostas. Para garantir sua privacidade, o servidor não se lembrará desta frase secreta: somente as pessoas com a frase secreta poderão decifrar e ler seus dados de respostas.",
          {
            "full": "Se você perder a dica de senha, não há {no} maneira de recuperar ela ou seus dados!",
            "no": "não"
          }
        ]
      }
    ],
    "success": [
      "Encriptação foi configurada para este Projeto. Todos os dispositivos móveis terão que buscar ou buscar novamente os Formulários mais recentes para que a encriptação ocorra."
    ],
    "field": {
      "hint": "Dica de senha (opcional)"
    },
    "alert": {
      "passphraseTooShort": "Insira uma dica de senha com pelo menos 10 caracteres."
    }
  },
  "sw": {
    "title": "Washa Usimbaji",
    "steps": [
      {
        "introduction": [
          [
            "Ukiwezesha usimbaji fiche, mambo yafuatayo yatafanyika:",
            "Data iliyokamilishwa ya Uwasilishaji itasimbwa kwa njia fiche kwenye vifaa vya mkononi.",
            "Data ya uwasilishaji imesalia itasimbwa kwa njia fiche kwenye seva ya Central",
            [
              "Fomu zilizosanidiwa kwa funguo za mwongozo za {submission} zitaendelea kutumia funguo hizo, na lazima zisimbuwe wewe mwenyewe",
              "li kutumia mchakato wa usimbaji fiche wa Kati kiotomatiki kwenye Fomu hizi, ondoa usanidi wa {base64RsaPublicKey}."
            ]
          ],
          [
            "kwa kuongeza, yafuatayo ni kweli katika toleo hili la ODK Central:",
            [
              "Mawasilisho yaliyopo yatasalia kuwa hayajasimbwa."
            ],
            [
              "Usimbaji fiche hauwezi kuzimwa baada ya kuwezeshwa"
            ],
            "Mawasilisho ya Jaribio kwa Fomu zilizopo Rasimu yataondolewa kabisa."
          ],
          {
            "full": "Unaweza kupata maelezo zaidi kuhusu usimbaji fiche {here}. Ikiwa hii inaonekana kama kitu unachotaka, bonyeza Ifuatayo ili kuendelea.",
            "here": "hapa"
          }
        ]
      },
      {
        "introduction": [
          "Kwanza, utahitaji kuchagua neno la siri. Kaulisiri hii itahitajika ili kusimbua Mawasilisho yako. Kwa faragha yako, seva haitakumbuka kaulisiri hii: watu walio na kaulisiri pekee wataweza kusimbua na kusoma data yako ya Wasilisho.",
          {
            "full": "Ukipoteza kaulisiri {no} hakuna njia ya kuirejesha au data yako",
            "no": "Hapana"
          }
        ]
      }
    ],
    "success": [
      "Usimbaji fiche umesanidiwa kwa Mradi huu. Kifaa chochote cha rununu kitalazimika kuleta au kuleta tena Fomu za hivi punde zaidi ili usimbaji fiche ufanyike."
    ],
    "field": {
      "hint": "Kidokezo cha kaulisiri (si lazima)"
    },
    "alert": {
      "passphraseTooShort": "Tafadhali weka kaulisiri yenye urefu wa angalau vibambo 10."
    }
  },
  "zh": {
    "title": "使用加密",
    "steps": [
      {
        "introduction": [
          [
            "如果您启用加密，以下情况将会发生：",
            "已最终提交的数据将在移动设备上被加密。",
            "静态提交数据将在Central服务器端加密存储。",
            [
              "配置了手动{submission}密钥的表单将继续使用原有密钥，且需手动解密。",
              "若需对这些表单启用Central自动加密流程，请移除{base64RsaPublicKey}配置项。"
            ],
            "您将无法在线编辑或查看提交数据。",
            "您将无法通过OData分析数据。",
            "您将无法在网页浏览器中编辑提交数据。",
            "新提交的数据将不再处理至实体。"
          ],
          [
            "此外，此版本ODK Central中以下情况适用：",
            [
              "现有提交数据将保持未加密状态。"
            ],
            [
              "加密功能一旦启用将无法关闭。"
            ],
            "现有草稿表单的测试提交数据将被永久删除。"
          ],
          {
            "full": "您可在{here}了解更多加密相关信息。若确认启用，请点击“下一步”继续。",
            "here": "此处"
          }
        ]
      },
      {
        "introduction": [
          "首先，您需要设置一个安全密钥。该口令将用于解密您所提交的数据。为保护您的隐私，服务器不会保存此口令：只有持有该口令的人员，才能解密并查阅您提交的数据。",
          {
            "full": "如果您遗失了该安全密钥，将无法{no}找回它或您的数据！",
            "no": "否"
          }
        ]
      }
    ],
    "success": [
      "加密功能已在此项目中配置完成。所有移动设备必须获取或重新获取最新版本的表单，才可以启用加密。"
    ],
    "field": {
      "hint": "安全密钥提示（可选）"
    },
    "alert": {
      "passphraseTooShort": "请输入至少10个字符长的安全密钥。"
    }
  },
  "zh-Hant": {
    "title": "啟用加密",
    "steps": [
      {
        "introduction": [
          [
            "如果啟用加密，將會發生以下情況：",
            "最終提交的資料將在行動裝置上加密。",
            "靜態提交資料將在中央伺服器上加密。",
            [
              "配置有手動 {submission} 金鑰的表單將繼續使用這些金鑰，並且必須手動解密。",
              "若要在這些表單上使用自動 Central 加密流程，請刪除 {base64RsaPublicKey} 設定。"
            ],
            "您將無法再在線上編輯或查看提交資料。",
            "您將無法再透過 OData 分析資料。",
            "您將無法再在網頁瀏覽器中編輯提交內容。",
            "新提交的內容將不再被處理為實體。"
          ],
          [
            "此外，在此版本的 ODK Central 中，以下內容均屬正確：",
            [
              "現有提交內容將保持未加密狀態。"
            ],
            [
              "加密一旦啟用就無法關閉。"
            ],
            "現有草稿表格的測試提交將永久刪除。"
          ],
          {
            "full": "您可以{here}了解更多有關加密的資訊。如果這聽起來像您想要的，請按「下一步」繼續。",
            "here": "從這裡"
          }
        ]
      },
      {
        "introduction": [
          "首先，您需要選擇一個密碼。需要此密碼才能解密您提交的內容。為了您的隱私，伺服器不會記住此密碼：只有擁有該密碼的人才能解密和讀取您的提交資料。",
          {
            "full": "如果您遺失了密碼，則{no}恢復它或您的資料！",
            "no": "沒辦法"
          }
        ]
      }
    ],
    "success": [
      "已為此專案配置加密。任何行動裝置都必須取得或重新取得最新的表單才能進行加密。"
    ],
    "field": {
      "hint": "密碼提示（可選）"
    },
    "alert": {
      "passphraseTooShort": "請輸入至少 10 個字元長的密碼。"
    }
  }
}
</i18n>
