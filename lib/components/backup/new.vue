<!--
Copyright 2017 Super Adventure Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/nafundi/super-adventure/blob/master/NOTICE.

This file is part of Super Adventure. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of Super Adventure,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <modal id="backup-new" ref="modal" :state="state"
    :hideable="!awaitingResponse" backdrop @hide="cancel"
    @shown="focusPassphraseInput">
    <template slot="title">Set up Backups</template>
    <template slot="body">
      <alert v-bind="alert" @close="alert.state = false"/>
      <template v-if="step === 1">
        <p class="modal-introduction">
          If you want, you may set up an encryption passphrase which must be
          used to unlock the backup. <strong>There is no way to recover the
          passphrase if you lose it!</strong> Be sure to pick something you will
          remember, or write it down somewhere safe.
        </p>
        <form @submit.prevent="initiate">
          <label class="form-group">
            <input ref="passphrase" v-model.trim="passphrase"
              :disabled="awaitingResponse" class="form-control"
              placeholder="Passphrase (optional)">
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
              placeholder="Confirmation text *">
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
import alert from '../../mixins/alert';
import request from '../../mixins/request';

const GOOGLE_BREAKPOINT = 601;

export default {
  name: 'BackupNew',
  mixins: [alert(), request()],
  props: {
    state: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      alert: alert.blank(),
      requestId: null,
      // The step in the wizard (1-indexed)
      step: 1,
      passphrase: '',
      googleUrl: null,
      authToken: null,
      confirmationText: ''
    };
  },
  methods: {
    problemToAlert(problem) {
      return this.step !== 3
        ? problem.message
        : `${problem.message} Please try again, and go to the community forum if the problem continues.`;
    },
    focusPassphraseInput() {
      this.$refs.passphrase.focus();
    },
    initiate() {
      // TODO. Does this implement "They should see a Next button which takes
      // them to Step 2 no matter what"?
      this
        .post('/config/backups/initiate', { passphrase: this.passphrase })
        .then(({ data }) => {
          this.step += 1;
          this.googleUrl = data.url;
          this.authToken = data.token;
          this.$refs.modal.$el.focus();
        })
        .catch(() => {});
    },
    reset() {
      this.alert = alert.blank();
      this.step = 1;
      this.passphrase = '';
      this.googleUrl = null;
      this.authToken = null;
      this.confirmationText = '';
    },
    cancel() {
      this.$emit('hide');
      this.reset();
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
      const data = { code: this.confirmationText };
      const headers = { Authorization: `Bearer ${this.authToken}` };
      this
        .post('/config/backups/verify', data, { headers })
        .then(() => {
          this.$emit('hide');
          this.reset();
          this.$emit('success');
        })
        .catch(() => {});
    }
  }
};
</script>
