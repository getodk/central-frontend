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
  <modal id="project-enable-encryption" :state="state" backdrop
    :hideable="!awaitingResponse" @hide="$emit(success ? 'success' : 'hide')">
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
              <doc-link to="central-encryption/">here</doc-link>
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
            :placeholder="$t('field.passphrase')" required autocomplete="off"/>
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
          {{ $t('steps[2].introduction[0]') }}
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
import Spinner from '../spinner.vue';
import request from '../../mixins/request';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
import { requestData } from '../../store/modules/request';

export default {
  name: 'ProjectEnableEncryption',
  components: { DocLink, FormGroup, Modal, Spinner },
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
            "You will no longer be able to connect to data over OData."
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
  "es": {
    "title": "Habilitar el cifrado.",
    "steps": [
      {
        "introduction": [
          [
            "Si usted habilita el cifrado, ocurrirán las siguientes cosas:",
            "Los datos de la presentación final serán cifrados en los dispositivos móviles.",
            "Los datos de la presentación que se encuentran en reposo serán cifrados en el servidor central.",
            [
              "{submission} Los formularios configurados con claves manuales continuarán utilizando esas claves y deben ser descifrados manualmente.",
              "Para utilizar el proceso automático de encriptación central en estos formularios, remueva la {base64RsaPublicKey}configuración"
            ],
            "Ya no podrá obtener una vista previa de los datos de la presentación en línea",
            "Ya no podrá conectarse a los datos a través de Odata."
          ],
          [
            "Además, lo siguiente es cierto en esta versión de ODK Central:",
            [
              "Las presentaciones existentes permanecerán sin cifrar.",
              "En una futura versión, tendrá la opción de cifrar los datos existentes."
            ],
            [
              "El cifrado no podrá ser desactivado una vez activado.",
              "En una versión futura, usted podrá desactivar el cifrado, que permitirá descifrar sus datos. Esto será efectivo incluso si habilita el cifrado ahora."
            ]
          ],
          {
            "full": "Puede obtener más información sobre cifrado {here}.Si esto suena como algo que desea hacer, presione siguiente para continuar.",
            "here": "Aquí"
          }
        ]
      },
      {
        "introduction": [
          "En primer lugar, necesitará seleccionar una frase de contraseña. Esta frase será requerida para descifrar sus presentaciones. Por su privacidad, el servidor no recordará esta frase: solo las personas con la frase de contraseña podrán descifrar y leer los datos de sus envíos.",
          {
            "full": "No hay restricciones de longitud o de contenido para la frase de contraseña, pero si usted la pierde, {no}habrá forma de recuperarla ni a sus datos!",
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
  }
}
</i18n>
