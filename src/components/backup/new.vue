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
  <modal id="backup-new" :state="state" :hideable="!awaitingResponse" backdrop
    @hide="$emit('hide')" @shown="$refs.passphrase.focus()">
    <template #title>{{ $t('title') }}</template>
    <template #body>
      <template v-if="step === 0">
        <p class="modal-introduction">
          {{ $t('steps[0].introduction[0]') }}
          <strong>{{ $t('steps[0].introduction[1]') }}</strong>
          {{ $t('steps[0].introduction[2]') }}
        </p>
        <form @submit.prevent="initiate">
          <form-group ref="passphrase" v-model="passphrase"
            :placeholder="$t('field.passphrase')" autocomplete="off"/>
          <div class="modal-actions">
            <button type="submit" class="btn btn-primary"
              :disabled="awaitingResponse">
              {{ $t('action.next') }} <spinner :state="awaitingResponse"/>
            </button>
            <button type="button" class="btn btn-link"
              :disabled="awaitingResponse" @click="$emit('hide')">
              {{ $t('action.cancel') }}
            </button>
          </div>
        </form>
      </template>
      <template v-else-if="step === 1">
        <div class="modal-introduction">
          <i18n tag="p" path="steps[1].introduction[0].full">
            <template #here>
              <a href="https://accounts.google.com/SignUp" target="_blank">{{ $t('steps[1].introduction[0].here') }}</a>
            </template>
          </i18n>
          <p>{{ $t('steps[1].introduction[1]') }}</p>
          <p>{{ $t('steps[1].introduction[2]') }}</p>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-primary"
            :disabled="awaitingResponse" @click="moveToConfirmation">
            {{ $t('action.next') }} <spinner :state="awaitingResponse"/>
          </button>
          <button type="button" class="btn btn-link"
            :disabled="awaitingResponse" @click="$emit('hide')">
            {{ $t('action.cancel') }}
          </button>
        </div>
      </template>
      <template v-if="step === 2">
        <div class="modal-introduction">
          <i18n tag="p" path="steps[2].introduction[0].full">
            <template #here>
              <a href="#" role="button" @click.prevent="openGoogle">{{ $t('steps[2].introduction[0].here') }}</a>
            </template>
          </i18n>
          <p>{{ $t('steps[2].introduction[1]') }}</p>
        </div>
        <form @submit.prevent="verify">
          <form-group ref="confirmationText" v-model.trim="confirmationText"
            :placeholder="$t('field.confirmationText')" required
            autocomplete="off"/>
          <div class="modal-actions">
            <button type="submit" class="btn btn-primary"
              :disabled="awaitingResponse">
              {{ $t('action.next') }} <spinner :state="awaitingResponse"/>
            </button>
            <button type="button" class="btn btn-link"
              :disabled="awaitingResponse" @click="$emit('hide')">
              {{ $t('action.cancel') }}
            </button>
          </div>
        </form>
      </template>
    </template>
  </modal>
</template>

<script>
import FormGroup from '../form-group.vue';
import Modal from '../modal.vue';
import Spinner from '../spinner.vue';
import request from '../../mixins/request';
import { noop } from '../../util/util';

const GOOGLE_BREAKPOINT = 601;

export default {
  name: 'BackupNew',
  components: { FormGroup, Modal, Spinner },
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
      googleUrl: null,
      authToken: null,
      confirmationText: ''
    };
  },
  watch: {
    state(state) {
      if (!state) {
        this.step = 0;
        this.passphrase = '';
        this.googleUrl = null;
        this.authToken = null;
        this.confirmationText = '';
      }
    }
  },
  methods: {
    initiate() {
      this.post('/config/backups/initiate', { passphrase: this.passphrase })
        .then(({ data }) => {
          this.step += 1;
          this.googleUrl = data.url;
          this.authToken = data.token;
        })
        .catch(noop);
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
    moveToConfirmation() {
      this.openGoogle();
      this.step += 1;
      this.$nextTick(() => {
        this.$refs.confirmationText.focus();
      });
    },
    verify() {
      this.request({
        method: 'POST',
        url: '/config/backups/verify',
        headers: { Authorization: `Bearer ${this.authToken}` },
        data: { code: this.confirmationText },
        problemToAlert: ({ message }) =>
          `${message} ${this.$t('problem.verify')}`
      })
        .then(() => {
          this.$emit('success');
        })
        .catch(noop);
    }
  }
};
</script>

<i18n lang="json5">
{
  "en": {
    // This is the title at the top of a pop-up.
    "title": "Set up Backups",
    "steps": [
      {
        "introduction": [
          "If you want, you may set up an encryption passphrase which must be used to unlock the backup.",
          "There is no way to recover the passphrase if you lose it!",
          "Be sure to pick something you will remember, or write it down somewhere safe."
        ]
      },
      {
        "introduction": [
          {
            "full": "For safekeeping, the server sends your data to Google Drive. You can sign up for a free account {here}.",
            "here": "here"
          },
          "When you press next, Google will confirm that you wish to allow the server to access your account. The only thing the server will be allowed to touch are the backup files it creates.",
          "Once you confirm this, you will be asked to copy and paste some text back here."
        ]
      },
      {
        "introduction": [
          {
            "full": "Welcome back! Did you get some text to copy and paste? If not, click {here} to try again.",
            "here": "here"
          },
          "Otherwise, paste it below and you are done!"
        ]
      }
    ],
    "field": {
      "passphrase": "Passphrase (optional)",
      "confirmationText": "Confirmation text"
    },
    "problem": {
      "verify": "Please try again, and go to the community forum if the problem continues."
    }
  }
}
</i18n>
