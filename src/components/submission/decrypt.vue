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
import { mapGetters } from 'vuex';

import FormGroup from '../form-group.vue';
import Modal from '../modal.vue';
import callWait from '../../mixins/call-wait';
import { isProblem } from '../../util/request';
import { requestData } from '../../store/modules/request';

export default {
  name: 'SubmissionDecrypt',
  components: { FormGroup, Modal },
  mixins: [callWait()],
  props: {
    state: {
      type: Boolean,
      default: false
    },
    formAction: String, // eslint-disable-line vue/require-default-prop
    delayBetweenChecks: {
      type: Number,
      default: 1000
    }
  },
  data() {
    return {
      calls: {},
      passphrase: ''
    };
  },
  computed: {
    ...requestData(['session']),
    ...mapGetters(['managedKey'])
  },
  watch: {
    state() {
      if (!this.state) {
        this.passphrase = '';
        this.cancelCall('checkForProblem');
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
    checkForProblem() {
      const doc = this.$refs.iframe.contentWindow.document;
      // If Backend returns a Problem, the iframe changes pages. However, if the
      // form submission is successful, it seems that the iframe does not change
      // pages, and the form remains on the page.
      if (doc.querySelector('form') != null || doc.body == null)
        return false;
      let problem;
      try {
        // Note that the Problem may be wrapped in another element, for example,
        // a <pre> element.
        problem = JSON.parse(doc.body.textContent);
      } catch (e) {
        this.$logger.error('cannot parse Problem');
      }
      if (isProblem(problem)) {
        this.$logger.error(problem);
        this.$alert().danger(problem.message);
      }
      return true;
    },
    scheduleProblemCheck() {
      this.cancelCall('checkForProblem');
      this.callWait(
        'checkForProblem',
        () => this.checkForProblem(),
        (tries) => (tries < 300 ? this.delayBetweenChecks : null)
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
      // Clear the form so that the inputs' values are no longer in the DOM.
      for (const input of form.querySelectorAll('input'))
        input.value = '';

      // Because the form submission is not an AJAX request, we will only know
      // the result of the request if a Problem is returned: if a Problem is
      // returned, the iframe will change pages, but if the download is
      // successful, the iframe seems not to change.
      this.$alert().info(this.$t('alert.submit'));

      this.scheduleProblemCheck();
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

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "title": "Dešifrovat a stáhnout",
    "introduction": [
      "Abyste mohli tato data stáhnout, budete muset zadat vaše přístupové heslo. Vaše přístupové heslo bude použito pouze k dešifrování vašich dat ke stažení, a poté ho server znovu zapomene."
    ],
    "hint": "Nápověda: {hint}",
    "alert": {
      "submit": "Stahování dat by mělo začít brzy. Jakmile to začne, můžete toto pole zavřít. Pokud jste čekali a nezačalo to, zkuste to znovu."
    }
  },
  "de": {
    "title": "Entschlüsseln und Herunterladen",
    "introduction": [
      "Um die Daten herunterzuladen wird Ihre Passphrase benötigt. Diese wird nur zum Entschlüsseln der Daten für den Download benutzt und nicht gespeichert."
    ],
    "hint": "Hinweis: {hint}",
    "alert": {
      "submit": "Ihr Daten-Download sollte bald beginnen. Sobald er beginnt, können Sie diese Box schließen. Wenn Sie gewartet haben und er hat nicht begonnen, versuchen Sie es erneut."
    }
  },
  "es": {
    "title": "Descifrar y descargar",
    "introduction": [
      "Para descargar la información, usted necesitará ingresar su contraseña. Su contraseña se usará para desencriptar la información descargada, al finalizar el proceso el servidor la olvidará."
    ],
    "hint": "Pista: {hint}",
    "alert": {
      "submit": "Su descarga de los datos comenzará pronto. Una vez que inicie, puede cerrar este cuadro. Si ha estado esperando y no ha comenzado, por favor inténtelo nuevamente."
    }
  },
  "fr": {
    "title": "Décrypter et télécharger",
    "introduction": [
      "Pour télécharger ces données, vous devrez fournir votre phrase secrète. Votre phrase secrète sera utilisée uniquement pour déchiffrer vos données pour le téléchargement, après quoi le serveur l'oubliera à nouveau"
    ],
    "hint": "Indice : {hint}",
    "alert": {
      "submit": "Le téléchargement de vos données devrait commencer bientôt. Une fois qu'il aura commencé, vous pourrez fermer cette boîte. Si vous avez attendu et que le téléchargement n'a pas commencé, veuillez réessayer."
    }
  },
  "id": {
    "title": "Dekripsi dan Unduh",
    "introduction": [
      "Untuk mengunduh data ini, Anda harus menyediakan frasa sandi. Frasa sandi hanya akan digunakan untuk mendekripsi data anda untuk diunduh, dan akan terhapus dari server setelahnya."
    ],
    "hint": "Petunjuk: {hint}",
    "alert": {
      "submit": "Unduhan Anda akan segera dimulai. Setelah unduhan dimulai, Anda dapat menutup kotak ini. Apabila Anda sudah menunggu dan unduhan belum dimulai, silakan coba lagi."
    }
  },
  "it": {
    "title": "Decifra e scarica",
    "introduction": [
      "Per scaricare questi dati, dovrai fornire la tua passphrase. La tua passphrase verrà utilizzata solo per decifrare i tuoi dati per il download, dopodiché il server la cancellerà."
    ],
    "hint": "Suggerimento: {hint}",
    "alert": {
      "submit": "Il download dei dati dovrebbe iniziare a breve. Una volta iniziato, puoi chiudere questa finestra. Se stai ancora aspettando e il download non è iniziato, riprova."
    }
  },
  "ja": {
    "title": "復号してダウンロード",
    "introduction": [
      "このデータをダウンロードするためには、パスフレーズを入力する必要があります。パスフレーズは、データをダウンロードする際の復号時にのみ使用され、その後、サーバーはパスフレーズを保持しません。"
    ],
    "hint": "ヒント：{hint}",
    "alert": {
      "submit": "データダウンロードはすぐに始まります。始まり次第、このボックスを閉じて構いません。開始されない場合は、もう一度試して下さい。"
    }
  }
}
</i18n>
