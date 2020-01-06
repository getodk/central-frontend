<!--
Copyright 2019 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/opendatakit/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <modal id="project-enable-encryption" :state="state" backdrop
    :hideable="!awaitingResponse" @hide="$emit(success ? 'success' : 'hide')">
    <template #title>Enable Encryption</template>
    <template #body>
      <template v-if="step === 0">
        <div class="modal-introduction">
          <div class="info-block">
            <p>If you enable encryption, the following things will happen:</p>
            <div class="info-item">
              <span class="icon-check"></span>
              <p>
                Finalized Submission data will be encrypted on mobile devices.
              </p>
            </div>
            <div class="info-item">
              <span class="icon-check"></span>
              <p>
                Submission data at rest will be encrypted on the Central server.
              </p>
            </div>
            <div class="info-item">
              <span class="icon-circle-o"></span>
              <p>
                Forms configured with manual <code>&lt;submission&gt;</code>
                keys will continue to use those keys, and must be manually
                decrypted.
              </p>
              <p>
                To use the automatic Central encryption process on these Forms,
                remove the <code>base64RsaPublicKey</code> configuration.
              </p>
            </div>
            <div class="info-item">
              <span class="icon-close"></span>
              <p>
                You will no longer be able to preview Submission data online.
              </p>
            </div>
            <div class="info-item">
              <span class="icon-close"></span>
              <p>You will no longer be able to connect to data over OData.</p>
            </div>
          </div>
          <div class="info-block">
            <p>
              In addition, the following are true in this version of ODK
              Central:
            </p>
            <div class="info-item">
              <span class="icon-circle-o"></span>
              <p>Existing Submissions will remain unencrypted.</p>
              <p>
                In a future version, you will have the option to encrypt
                existing data.
              </p>
            </div>
            <div class="info-item">
              <span class="icon-close"></span>
              <p>Encryption cannot be turned off once enabled.</p>
              <p>
                In a future version, you will be able to disable encryption,
                which will decrypt your data. This will be true even if you
                enable encryption now.
              </p>
            </div>
          </div>
          <p>
            You can learn more about encryption
            <doc-link to="central-encryption/">here</doc-link>. If this sounds
            like something you want, press Next to proceed.
          </p>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-primary" @click="moveToForm">
            Next
          </button>
          <button type="button" class="btn btn-link" @click="$emit('hide')">
            Never mind, cancel
          </button>
        </div>
      </template>
      <template v-else-if="step === 1">
        <div class="modal-introduction">
          <p>
            First, you will need to choose a passphrase. This passphrase will be
            required to decrypt your Submissions. For your privacy, the server
            will not remember this passphrase: only people with the passphrase
            will be able to decrypt and read your Submission data.
          </p>
          <p>
            There are no length or content restrictions on the passphrase, but
            if you lose it, there is <strong>no</strong> way to recover it or
            your data!
          </p>
        </div>
        <form @submit.prevent="submit">
          <label class="form-group">
            <input ref="passphrase" v-model="passphrase" class="form-control"
              placeholder="Passphrase *" required autocomplete="off">
            <span class="form-label">Passphrase *</span>
          </label>
          <label class="form-group">
            <input v-model.trim="hint" class="form-control"
              placeholder="Passphrase hint (optional)" autocomplete="off">
            <span class="form-label">Passphrase hint (optional)</span>
          </label>
          <div class="modal-actions">
            <button type="submit" class="btn btn-primary"
              :disabled="awaitingResponse">
              Next <spinner :state="awaitingResponse"/>
            </button>
            <button type="button" class="btn btn-link"
              :disabled="awaitingResponse" @click="$emit('hide')">
              Never mind, cancel
            </button>
          </div>
        </form>
      </template>
      <template v-else>
        <p id="project-enable-encryption-success-icon-container">
          <span class="icon-check-circle"></span>
        </p>
        <p class="modal-introduction">
          <strong>Success!</strong> Encryption has been configured for this
          Project. Any mobile devices will have to fetch or refetch the latest
          Forms for encryption to take place.
        </p>
        <div class="modal-actions">
          <button type="button" class="btn btn-primary"
            @click="$emit('success')">
            Done
          </button>
        </div>
      </template>
    </template>
  </modal>
</template>

<script>
import DocLink from '../doc-link.vue';
import Modal from '../modal.vue';
import Spinner from '../spinner.vue';
import request from '../../mixins/request';
import { noop } from '../../util/util';
import { requestData } from '../../store/modules/request';

export default {
  name: 'ProjectEnableEncryption',
  components: { DocLink, Modal, Spinner },
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
      this.post(`/projects/${this.project.id}/key`, data)
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
