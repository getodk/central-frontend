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
  <div id="account-login" class="row">
    <div class="col-xs-12 col-sm-offset-3 col-sm-6">
      <div class="panel panel-default panel-main">
        <div class="panel-heading">
          <h1 class="panel-title">{{ $t('action.logIn') }}</h1>
        </div>
        <div v-if="config.oidcEnabled" class="panel-body">
          <p>{{ $t('oidc.body') }}</p>
          <div class="panel-footer">
            <a :href="oidcLoginPath" class="btn btn-primary"
              :class="{ disabled }" @click="loginByOIDC">
              {{ $t('action.continue') }} <spinner :state="disabled"/>
            </a>
          </div>
        </div>
        <div v-else class="panel-body">
          <form @submit.prevent="submit">
            <form-group ref="email" v-model.trim="email" type="email"
              :placeholder="$t('field.email')" required autocomplete="off"/>
            <form-group v-model="password" type="password"
              :placeholder="$t('field.password')" required
              autocomplete="current-password"/>
            <div class="panel-footer">
              <button type="submit" class="btn btn-primary"
                :aria-disabled="disabled">
                {{ $t('action.logIn') }} <spinner :state="disabled"/>
              </button>
              <router-link v-slot="{ navigate }" to="/reset-password" custom>
                <button type="button" class="btn btn-link" :aria-disabled="disabled"
                  @click="navigate">
                  {{ $t('action.resetPassword') }}
                </button>
              </router-link>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import FormGroup from '../form-group.vue';
import Spinner from '../spinner.vue';

import { enketoBasePath, noop } from '../../util/util';
import { localStore } from '../../util/storage';
import { logIn } from '../../util/session';
import { queryString } from '../../util/request';
import { useRequestData } from '../../request-data';

export default {
  name: 'AccountLogin',
  components: { FormGroup, Spinner },
  inject: ['container', 'alert', 'config'],
  beforeRouteLeave() {
    return !this.disabled;
  },
  setup() {
    const { session } = useRequestData();
    return { session };
  },
  data() {
    return {
      disabled: false,
      email: '',
      password: ''
    };
  },
  computed: {
    oidcLoginPath() {
      const { query } = this.$route;
      const next = typeof query.next === 'string' ? query.next : null;
      const qs = queryString({ next });
      return `/v1/oidc/login${qs}`;
    }
  },
  created() {
    this.handleOIDCError();
  },
  mounted() {
    if (this.config.oidcEnabled)
      window.addEventListener('pageshow', this.reenableIfPersisted);
    else
      this.$refs.email.focus();
  },
  beforeUnmount() {
    if (this.config.oidcEnabled)
      window.removeEventListener('pageshow', this.reenableIfPersisted);
  },
  methods: {
    verifyNewSession() {
      const sessionExpires = localStore.getItem('sessionExpires');
      const newSession = sessionExpires == null ||
        Number.parseInt(sessionExpires, 10) < Date.now();
      if (!newSession) this.alert.info(this.$t('alert.alreadyLoggedIn'));
      return newSession;
    },
    loginByOIDC(event) {
      if (!this.verifyNewSession()) {
        event.preventDefault();
        return;
      }

      this.disabled = true;
    },
    async handleOIDCError() {
      if (!this.config.oidcEnabled) return;

      const { oidcError, ...queryWithoutError } = this.$route.query;
      if (oidcError === undefined) return;
      // Remove the query parameter so that if the user refreshes the page, the
      // alert that we are about to show is not shown again.
      await this.$router.replace({ path: '/login', query: queryWithoutError });

      if (typeof oidcError === 'string' && /^[\w-]+$/.test(oidcError)) {
        const path = `oidc.error.${oidcError}`;
        if (this.$te(path, this.$i18n.fallbackLocale))
          this.alert.danger(this.$t(path));
      }
    },
    /* Pressing the back button on the IdP login page may restore Frontend from
    the back/forward cache. In that case, this.disabled would still be `true` --
    a confusing state for the user to return to. Instead, if the user comes back
    from the IdP, we set this.disabled to `false`, re-enabling the component.
    This method may be called in other cases as well, for example, if the user
    presses back on the Frontend login page, then presses forward to return to
    Frontend. It should be OK to set this.disabled to `false` in any such case:
    there's no real issue if the link ends up getting clicked multiple times. */
    reenableIfPersisted(event) {
      if (event.persisted) this.disabled = false;
    },
    navigateToNext(
      next,
      // Function that redirects within Frontend
      internal,
      // Function that redirects outside Frontend
      external
    ) {
      if (typeof next !== 'string') return internal('/');
      let url;
      try {
        url = new URL(next, window.location.origin);
      } catch (e) {
        return internal('/');
      }
      if (url.origin !== window.location.origin || url.pathname === '/login')
        return internal('/');

      if (url.pathname.startsWith(`${enketoBasePath}/`))
        return external(url.href);
      return internal(url.pathname + url.search + url.hash);
    },
    submit() {
      if (!this.verifyNewSession()) return;
      this.disabled = true;
      this.session.request({
        method: 'POST',
        url: '/v1/sessions',
        data: { email: this.email, password: this.password },
        problemToAlert: ({ code }) =>
          (code === 401.2 ? this.$t('problem.401_2') : null)
      })
        .then(() => logIn(this.container, true))
        .then(() => {
          this.navigateToNext(
            this.$route.query.next,
            (location) => {
              // We only set this.disabled to `false` before redirecting within
              // Frontend. If we also set this.disabled before redirecting
              // outside Frontend, the buttons might be re-enabled before the
              // external page is loaded.
              this.disabled = false;
              const message = this.$t('alert.changePassword');
              this.$router.replace(location)
                .catch(noop)
                .then(() => {
                  if (this.password.length < 10) this.alert.info(message);
                });
            },
            (url) => {
              window.location.replace(url);
            }
          );
        })
        .catch(() => {
          this.disabled = false;
        });
    }
  }
};
</script>

<i18n lang="json5">
{
  "en": {
    "alert": {
      "alreadyLoggedIn": "A user is already logged in. Please refresh the page to continue.",
      "changePassword": "Your password is shorter than 10 characters. To protect your account, please change your password to make it longer."
    },
    "oidc": {
      "body": "Click Continue to proceed to the login page.",
      "error": {
        "auth-ok-user-not-found": "There is no Central account associated with your email address. Please ask your Central administrator to create an account for you to continue.",
        "email-not-verified": "Your email address has not been verified by your login server. Please contact your server administrator.",
        "email-claim-not-provided": "Central could not access the email address associated with your account. This could be because your server administrator has configured something incorrectly, or has not set an email address for your account. It could also be the result of privacy options that you can choose during the login process. If so, please try again and ensure that your email is shared.",
        "internal-server-error": "Something went wrong during login. Please contact your server administrator."
      }
    },
    "problem": {
      "401_2": "Incorrect email address and/or password."
    }
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "alert": {
      "alreadyLoggedIn": "Uživatel je již přihlášen. Chcete-li pokračovat, obnovte stránku.",
      "changePassword": "Vaše heslo je kratší než 10 znaků. Chcete-li svůj účet chránit, změňte si heslo tak, aby bylo delší."
    },
    "oidc": {
      "body": "Kliknutím na tlačítko Pokračovat přejdete na přihlašovací stránku.",
      "error": {
        "auth-ok-user-not-found": "K vaší e-mailové adrese není přiřazen žádný centrální účet. Požádejte prosím správce Central, aby vám vytvořil účet, abyste mohli pokračovat.",
        "email-not-verified": "Vaše e-mailová adresa nebyla ověřena přihlašovacím serverem. Obraťte se prosím na správce serveru.",
        "email-claim-not-provided": "Central nemohl získat přístup k e-mailové adrese přidružené k vašemu účtu. Může to být způsobeno tím, že správce serveru něco špatně nakonfiguroval nebo že e-mailovou adresu pro váš účet nenastavil. Může to být také důsledek možností ochrany osobních údajů, které můžete zvolit během přihlašovacího procesu. V takovém případě to zkuste znovu a ujistěte se, že je váš e-mail sdílený.",
        "internal-server-error": "Při přihlašování se něco pokazilo. Kontaktujte prosím správce serveru."
      }
    },
    "problem": {
      "401_2": "Nesprávná e-mailová adresa nebo heslo."
    }
  },
  "de": {
    "alert": {
      "alreadyLoggedIn": "Ein Benutzer ist bereits eingeloggt. Bitte die Seite aktualisieren um weiterzuarbeiten.",
      "changePassword": "Ihr Passwort ist kürzer als 10 Zeichen. Um Ihr Konto zu schützen, verlängerns Sie bitte Ihr Passwort."
    },
    "oidc": {
      "body": "Klicken Sie auf Weiter, um zur Anmeldeseite zu gelangen.",
      "error": {
        "auth-ok-user-not-found": "Mit Ihrer E-Mail-Adresse ist kein Central-Konto verknüpft. Bitten Sie Ihren zentralen Administrator, ein Konto zu erstellen, damit Sie fortfahren können.",
        "email-not-verified": "Ihre E-Mail-Adresse wurde von Ihrem Anmeldeserver nicht überprüft. Bitte wenden Sie sich an Ihren Serveradministrator.",
        "email-claim-not-provided": "Central konnte nicht auf die mit Ihrem Konto verknüpfte E-Mail-Adresse zugreifen. Dies kann daran liegen, dass Ihr Serveradministrator etwas falsch konfiguriert hat oder keine E-Mail-Adresse für Ihr Konto festgelegt hat. Dies könnte auch auf Datenschutzoptionen zurückzuführen sein, die Sie während des Anmeldevorgangs auswählen können. Wenn ja, versuchen Sie es bitte erneut und stellen Sie sicher, dass Ihre E-Mail-Adresse geteilt wird.",
        "internal-server-error": "Beim Anmelden ist ein Fehler aufgetreten. Bitte wenden Sie sich an Ihren Serveradministrator."
      }
    },
    "problem": {
      "401_2": "Falsche E-Mail-Adresse und/oder Passwort."
    }
  },
  "es": {
    "alert": {
      "alreadyLoggedIn": "Un usuario ya ha iniciado sesión. Actualice la página para continuar.",
      "changePassword": "Su contraseña tiene menos de 10 caracteres. Para proteger su cuenta, cambie su contraseña para que sea más larga."
    },
    "oidc": {
      "body": "Haga clic en Continuar para pasar a la página de inicio de sesión.",
      "error": {
        "auth-ok-user-not-found": "No hay ninguna cuenta Central asociada con su dirección de correo electrónico. Pídale a su administrador central que cree una cuenta para continuar.",
        "email-not-verified": "Su dirección de correo electrónico no ha sido verificada por su servidor de inicio de sesión. Comuníquese con el administrador de su servidor.",
        "email-claim-not-provided": "Central no pudo acceder a la dirección de correo electrónico asociada con su cuenta. Esto podría deberse a que el administrador de su servidor haya configurado algo incorrectamente o no haya configurado una dirección de correo electrónico para su cuenta. También podría ser el resultado de las opciones de privacidad que puedes elegir durante el proceso de inicio de sesión. Si es así, inténtalo de nuevo y asegúrate de que tu correo electrónico esté compartido.",
        "internal-server-error": "Algo salió mal durante el inicio de sesión. Comuníquese con el administrador de su servidor."
      }
    },
    "problem": {
      "401_2": "Dirección de correo electrónico y/o contraseña incorrecta."
    }
  },
  "fr": {
    "alert": {
      "alreadyLoggedIn": "Un utilisateur est déjà connecté. Merci de rafraîchir la page pour continuer.",
      "changePassword": "Votre mot de passe fait moins de 10 caractères. Pour protéger votre compte, merci de choisir un mot de passe plus long."
    },
    "oidc": {
      "body": "Cliquez sur Continuer pour accéder à la page de connexion.",
      "error": {
        "auth-ok-user-not-found": "Il n'y a pas de compte Central associé à votre adresse de courriel. Veuillez demander à votre administrateur de Central de vous créer un compte pour continuer.",
        "email-not-verified": "Votre adresse de courriel n'a pas été vérifiée par votre serveur de connexion. Veuillez contacter l'administrateur de votre serveur.",
        "email-claim-not-provided": "Central n'a pas pu accéder à l'adresse de courriel associée à votre compte. Cela peut être dû au fait que l'administrateur de votre serveur a configuré quelque chose de manière incorrecte ou n'a pas défini d'adresse de courriel pour votre compte. Cela peut également être dû aux options de confidentialité que vous pouvez choisir durant la procédure de connexion. Si c'est le cas, veuillez réessayer et vous assurer que votre adresse de courriel est partagée.",
        "internal-server-error": "Un problème s'est produit lors de la connexion. Veuillez contacter l'administrateur de votre serveur."
      }
    },
    "problem": {
      "401_2": "Adresse de courriel et/ou mot de passe invalides."
    }
  },
  "id": {
    "alert": {
      "alreadyLoggedIn": "Seorang pengguna sudah masuk. Mohon perbarui halaman untuk melanjutkan."
    },
    "problem": {
      "401_2": "Alamat email dan/atau kata sandi salah."
    }
  },
  "it": {
    "alert": {
      "alreadyLoggedIn": "Un utente ha già effettuato l'accesso. Aggiorna la pagina per continuare.",
      "changePassword": "La tua password è lunga meno di 10 caratteri. Per proteggere il tuo account, cambia la password per renderla più lunga."
    },
    "oidc": {
      "body": "Fare clic su Continua per passare alla pagina di Login.",
      "error": {
        "auth-ok-user-not-found": "Al suo indirizzo e-mail non è associato alcun account su Central. Chiedete all'amministratore di Central di creare un account per continuare.",
        "email-not-verified": "Il vostro indirizzo e-mail non è stato verificato dal server di accesso. Contattare l'amministratore del server.",
        "email-claim-not-provided": "Central non è riuscito ad accedere all'indirizzo e-mail associato al vostro account. Ciò potrebbe essere dovuto al fatto che l'amministratore del server ha configurato qualcosa di errato o non ha impostato un indirizzo e-mail per l'account. Potrebbe anche essere il risultato delle opzioni di privacy che si possono scegliere durante il processo di login. In tal caso, riprovare e assicurarsi che il proprio indirizzo e-mail sia condiviso.",
        "internal-server-error": "Qualcosa è andato storto durante l'accesso. Contattare l'amministratore del server."
      }
    },
    "problem": {
      "401_2": "Indirizzo e-mail e/o password errati."
    }
  },
  "ja": {
    "alert": {
      "alreadyLoggedIn": "すでにユーザーでログインされています。 続けるにはページを更新してください。",
      "changePassword": "あなたのパスワードは10文字以下です。アカウントを守るため、パスワードを長いものに変更してください。"
    },
    "problem": {
      "401_2": "メールアドレスとパスワードの一方、または両方が違います。"
    }
  },
  "sw": {
    "alert": {
      "alreadyLoggedIn": "Mtumiaji tayari ameingia. Tafadhali onyesha upya ukurasa ili kuendelea.",
      "changePassword": "Nenosiri lako ni fupi kuliko vibambo 10. Ili kulinda akaunti yako, tafadhali badilisha nenosiri lako ili kuifanya iwe ndefu."
    },
    "oidc": {
      "body": "Bofya Endelea ili kuendelea na ukurasa wa kuingia.",
      "error": {
        "auth-ok-user-not-found": "Hakuna akaunti ya Kati inayohusishwa na anwani yako ya barua pepe. Tafadhali muulize msimamizi wako Mkuu akufungulie akaunti ili uendelee.",
        "email-not-verified": "Anwani yako ya barua pepe haijathibitishwa na seva yako ya kuingia. Tafadhali wasiliana na msimamizi wa seva yako.",
        "email-claim-not-provided": "Central haikuweza kufikia anwani ya barua pepe inayohusishwa na akaunti yako. Hii inaweza kuwa kwa sababu msimamizi wa seva yako amesanidi kitu vibaya, au hajaweka anwani ya barua pepe kwa akaunti yako. Inaweza pia kuwa matokeo ya chaguzi za faragha ambazo unaweza kuchagua wakati wa mchakato wa kuingia. Ikiwa ndivyo, tafadhali jaribu tena na uhakikishe kuwa barua pepe yako inashirikiwa.",
        "internal-server-error": "Hitilafu fulani imetokea wakati wa kuingia. Tafadhali wasiliana na msimamizi wa seva yako."
      }
    },
    "problem": {
      "401_2": "Anwani ya barua pepe na/au nenosiri si sahihi."
    }
  },
  "zh-Hant": {
    "alert": {
      "alreadyLoggedIn": "使用者已登入，重新載入頁面再繼續進行。",
      "changePassword": "您的密碼少於 10 個字元。為了保護您的帳戶，請變更密碼並增加密碼長度。"
    },
    "oidc": {
      "body": "點選繼續進入登入頁面。",
      "error": {
        "auth-ok-user-not-found": "沒有與您的電子郵件地址關聯的 Central 帳戶。請要求您的 Central 管理員建立帳戶以便您繼續登入。",
        "email-not-verified": "您的登入伺服器尚未驗證您的電子郵件地址。請聯絡您的伺服器管理員。",
        "email-claim-not-provided": "Central 無法存取與您的帳戶關聯的電子郵件地址。這可能是因為您的伺服器管理員配置不正確，或沒有為您的帳戶設定電子郵件地址。這也可能是您在登入過程中可以選擇的隱私選項的結果。如果是這樣，請重試並確保您的電子郵件已分享。",
        "internal-server-error": "登入期間出現問題。請聯絡您的伺服器管理員。"
      }
    },
    "problem": {
      "401_2": "電子郵件地址和/或密碼不正確。"
    }
  }
}
</i18n>
