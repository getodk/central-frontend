<!--
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/opendatakit/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <modal id="backup-new" :state="state" :hideable="!awaitingResponse" backdrop
    @hide="cancel" @shown="focusPassphraseInput">
    <template slot="title">Set up Backups</template>
    <template slot="body">
      <template v-if="step === 1">
        <p class="modal-introduction">
          If you want, you may set up an encryption passphrase which must be
          used to unlock the backup. <strong>There is no way to recover the
          passphrase if you lose it!</strong> Be sure to pick something you will
          remember, or write it down somewhere safe.
        </p>
        <form @submit.prevent="initiate">
          <label class="form-group">
            <input ref="passphrase" v-model="passphrase"
              :disabled="awaitingResponse" class="form-control"
              placeholder="Passphrase (optional)" autocomplete="off">
            <span class="form-label">Passphrase (optional)</span>
          </label>
          <div class="modal-actions">
            <button :disabled="awaitingResponse" type="submit"
              class="btn btn-primary">
              Next <spinner :state="awaitingResponse"/>
            </button>
            <button :disabled="awaitingResponse" type="button"
              class="btn btn-link" @click="cancel">
              Cancel
            </button>
          </div>
        </form>
      </template>
      <template v-else-if="step === 2">
        <div class="modal-introduction">
          <p>
            For safekeeping, I send your data to Google Drive. You can sign up
            for a free account
            <a href="https://accounts.google.com/SignUp" target="_blank">here</a>.
          </p>
          <p>
            When you press next, Google will confirm that you wish to allow me
            to access your account. The only thing I will be allowed to touch
            are the backup files I create.
          </p>
          <p>
            Once you confirm this, you will be asked to copy and paste some text
            back here. I’ll wait for you.
          </p>
        </div>
        <div class="modal-actions">
          <button :disabled="awaitingResponse" type="button"
            class="btn btn-primary" @click="moveToStep3">
            Next <spinner :state="awaitingResponse"/>
          </button>
          <button :disabled="awaitingResponse" type="button"
            class="btn btn-link" @click="cancel">
            Cancel
          </button>
        </div>
      </template>
      <template v-if="step === 3">
        <div class="modal-introduction">
          <p>
            Welcome back! Did you get some text to copy and paste? If not, click
            <a href="#" role="button" @click.prevent="openGoogle">here</a> to
            try again.
          </p>
          <p>Otherwise, paste it below and you are done!</p>
        </div>
        <form @submit.prevent="verify">
          <label class="form-group">
            <input ref="confirmationText" v-model.trim="confirmationText"
              :disabled="awaitingResponse" class="form-control" required
              placeholder="Confirmation text *" autocomplete="off">
            <span class="form-label">Confirmation text *</span>
          </label>
          <div class="modal-actions">
            <button :disabled="awaitingResponse" type="submit"
              class="btn btn-primary">
              Next <spinner :state="awaitingResponse"/>
            </button>
            <button :disabled="awaitingResponse" type="button"
              class="btn btn-link" @click="cancel">
              Cancel
            </button>
          </div>
        </form>
      </template>
    </template>
  </modal>
</template>

<script>
import Modal from '../modal.vue';
import Spinner from '../spinner.vue';
import request from '../../mixins/request';
import { noop } from '../../util/util';

const GOOGLE_BREAKPOINT = 601;

export default {
  name: 'BackupNew',
  components: { Modal, Spinner },
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
      // The step in the wizard (1-indexed)
      step: 1,
      passphrase: '',
      googleUrl: null,
      authToken: null,
      confirmationText: ''
    };
  },
  watch: {
    state(state) {
      if (!state) return;
      this.step = 1;
      this.passphrase = '';
      this.googleUrl = null;
      this.authToken = null;
      this.confirmationText = '';
    }
  },
  methods: {
    focusPassphraseInput() {
      this.$refs.passphrase.focus();
    },
    initiate() {
      this.post('/config/backups/initiate', { passphrase: this.passphrase })
        .then(({ data }) => {
          this.step += 1;
          this.googleUrl = data.url;
          this.authToken = data.token;
        })
        .catch(noop);
    },
    cancel() {
      this.$emit('hide');
    },
    openGoogle() {
      const size = window.innerWidth >= GOOGLE_BREAKPOINT
        ? `width=${GOOGLE_BREAKPOINT},height=${window.innerHeight},`
        : '';
      window.open(
        this.googleUrl,
        '_blank',
        `${size}location,resizable,scrollbars,status`
      );
    },
    moveToStep3() {
      this.openGoogle();
      this.step += 1;
      this.$nextTick(() => this.$refs.confirmationText.focus());
    },
    verify() {
      this.request({
        method: 'POST',
        url: '/config/backups/verify',
        headers: { Authorization: `Bearer ${this.authToken}` },
        data: { code: this.confirmationText },
        problemToAlert: ({ message }) =>
          `${message} Please try again, and go to the community forum if the problem continues.`
      })
        .then(() => {
          this.$emit('success');
        })
        .catch(noop);
    }
  }
};
</script>
