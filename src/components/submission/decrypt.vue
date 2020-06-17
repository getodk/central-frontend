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
  <modal :state="state" hideable backdrop @hide="$emit('hide')"
    @shown="$refs.passphrase.focus()">
    <template #title>{{ $t('title') }}</template>
    <template #body>
      <p class="modal-introduction">{{ $t('introduction[0]') }}</p>
      <form @submit.prevent="submit">
        <form-group ref="passphrase" v-model="passphrase" type="password"
          :placeholder="$t('field.passphrase')" required autocomplete="off"/>
        <p v-if="managedKey != null && managedKey.hint != null"
          class="modal-introduction">
          {{ $t('hint', managedKey) }}
        </p>
        <div class="modal-actions">
          <button type="submit" class="btn btn-primary">
            {{ $t('action.download') }}
          </button>
          <button type="button" class="btn btn-link" @click="$emit('hide')">
            {{ $t('action.cancel') }}
          </button>
        </div>
      </form>
      <!-- We specify a Frontend page for src so that any cookies are sent when
      the iframe form is submitted. -->
      <iframe v-show="false" ref="iframe" src="/blank.html"></iframe>
    </template>
  </modal>
</template>

<script>
import FormGroup from '../form-group.vue';
import Modal from '../modal.vue';
import { isProblem } from '../../util/request';
import { requestData } from '../../store/modules/request';

export default {
  name: 'SubmissionDecrypt',
  components: { FormGroup, Modal },
  props: {
    state: {
      type: Boolean,
      default: false
    },
    managedKey: Object, // eslint-disable-line vue/require-default-prop
    formAction: {
      type: String,
      required: true
    },
    delayBetweenChecks: {
      type: Number,
      default: 1000
    }
  },
  data() {
    return {
      passphrase: '',
      // The number of times the iframe will be checked for a Problem after the
      // iframe form is submitted
      problemChecks: 0,
      timeoutId: null
    };
  },
  computed: requestData(['session']),
  watch: {
    state() {
      if (this.state) return;
      this.passphrase = '';
      this.problemChecks = 0;
      if (this.timeoutId != null) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }
    }
  },
  methods: {
    /*
    replaceIframeBody() empties the iframe body, then appends a form to it. We
    place a form in an iframe for a few reasons:

      - We want to have the browser handle everything about the download, which
        means that we cannot use an AJAX request.
      - Our two options are an <a> element and a <form> element. We use a form
        so that we can send a POST request. If we wish to securely pass the
        passphrase to Backend, then assuming that wire security is not an issue,
        we still need to ensure that the passphrase is not stored in the user's
        browser history. A POST request allows us to accomplish that.
      - However, submitting a form outside an iframe would navigate away from
        Frontend, at least if a Problem is returned. Thus, we place the form
        inside an iframe. The iframe may change pages, but that won't affect the
        rest of Frontend.

    Note that because the iframe may change pages after the form is submitted
    (if a Problem is returned), we recreate the form each time we submit it.
    */
    replaceIframeBody() {
      const doc = this.$refs.iframe.contentWindow.document;
      doc.body.innerHTML = '';
      const form = doc.createElement('form');
      form.setAttribute('method', 'post');
      form.setAttribute('action', this.formAction);
      doc.body.appendChild(form);

      const passphraseInput = doc.createElement('input');
      // This might not be necessary (not sure).
      passphraseInput.setAttribute('type', 'password');
      passphraseInput.setAttribute('name', this.managedKey.id.toString());
      passphraseInput.setAttribute('autocomplete', 'off');
      form.appendChild(passphraseInput);

      const csrf = doc.createElement('input');
      csrf.setAttribute('type', 'password');
      csrf.setAttribute('name', '__csrf');
      csrf.setAttribute('autocomplete', 'off');
      form.appendChild(csrf);

      passphraseInput.value = this.passphrase;
      csrf.value = this.session.csrf;
    },
    // scheduleProblemCheck() checks the iframe for a Problem after waiting. We
    // check for a Problem in this way, because when the iframe form is
    // submitted, it is not an AJAX request, so there is not another way to know
    // whether a Problem was returned (I think).
    scheduleProblemCheck() {
      this.timeoutId = setTimeout(
        () => {
          const doc = this.$refs.iframe.contentWindow.document;
          // If Backend returns a Problem, the iframe changes pages. However, if
          // the form submission is successful, it seems that the iframe does
          // not change pages, and the form remains on the page.
          if (doc.querySelector('form') == null && doc.body != null) {
            let problem;
            try {
              // Note that the Problem may be wrapped in another element, for
              // example, a <pre> element.
              problem = JSON.parse(doc.body.textContent);
            } catch (e) {
              this.$logger.error('cannot parse Problem');
            }
            if (isProblem(problem)) {
              this.$logger.error(problem);
              this.$alert().danger(problem.message);
            }
            this.problemChecks = 0;
            this.timeoutId = null;
          } else {
            this.problemChecks -= 1;
            if (this.problemChecks > 0)
              this.scheduleProblemCheck();
            else
              this.timeoutId = null;
          }
        },
        this.delayBetweenChecks
      );
    },
    submit() {
      // Return immediately if the iframe is still loading. It would probably be
      // better to wait for the iframe to load, then continue the process then,
      // but there would be edge cases to consider in implementing that. (For
      // example, what if the user submits the form, but then closes the modal
      // before the iframe finishes loading?)
      const iframeDoc = this.$refs.iframe.contentWindow.document;
      if (iframeDoc.readyState === 'loading') return;

      this.replaceIframeBody();
      const form = iframeDoc.body.querySelector('form');
      form.submit();
      // Make sure that the passphrase is no longer in the DOM. (This might not
      // be necessary -- not sure.)
      form.querySelector('input').value = '';

      // Because the form submission is not an AJAX request, we will only know
      // the result of the request if a Problem is returned: if a Problem is
      // returned, the iframe will change pages, but if the download is
      // successful, the iframe seems not to change.
      this.$alert().info(this.$t('alert.submit'));

      this.problemChecks = 300;
      if (this.timeoutId == null) this.scheduleProblemCheck();
    }
  }
};
</script>

<i18n lang="json5">
{
  "en": {
    // This is the title at the top of a pop-up.
    "title": "Decrypt and Download",
    "introduction": [
      "In order to download this data, you will need to provide your passphrase. Your passphrase will be used only to decrypt your data for download, after which the server will forget it again."
    ],
    // This text is shown if there is a passphrase hint. {hint} is the
    // passphrase hint.
    "hint": "Hint: {hint}",
    "alert": {
      "submit": "Your data download should begin soon. Once it begins, you can close this box. If you have been waiting and it has not started, please try again."
    }
  }
}
</i18n>
