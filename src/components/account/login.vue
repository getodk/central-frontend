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
        <div class="panel-body">
          <form @submit.prevent="submit">
            <form-group ref="email" v-model.trim="email" type="email"
              :placeholder="$t('field.email')" required autocomplete="off"/>
            <form-group v-model="password" type="password"
              :placeholder="$t('field.password')" required
              autocomplete="current-password"/>
            <div class="panel-footer">
              <button type="submit" class="btn btn-primary"
                :disabled="disabled">
                {{ $t('action.logIn') }} <spinner :state="disabled"/>
              </button>
              <router-link v-slot="{ navigate }" to="/reset-password" custom>
                <button type="button" class="btn btn-link" :disabled="disabled"
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
import { useRequestData } from '../../request-data';

export default {
  name: 'AccountLogin',
  components: { FormGroup, Spinner },
  inject: ['container', 'alert'],
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
  mounted() {
    this.$refs.email.focus();
  },
  methods: {
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
      const sessionExpires = localStore.getItem('sessionExpires');
      if (sessionExpires != null && parseInt(sessionExpires, 10) > Date.now()) {
        this.alert.info(this.$t('alert.alreadyLoggedIn'));
        return;
      }

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
    "problem": {
      "401_2": "Nesprávná e-mailová adresa nebo heslo."
    }
  },
  "de": {
    "alert": {
      "alreadyLoggedIn": "Ein Benutzer ist bereits eingeloggt. Bitte die Seite aktualisieren um weiterzuarbeiten.",
      "changePassword": "Ihr Passwort ist kürzer als 10 Zeichen. Um Ihr Konto zu schützen, verlängerns Sie bitte Ihr Passwort."
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
    "problem": {
      "401_2": "Dirección de correo electrónico y/o contraseña incorrecta."
    }
  },
  "fr": {
    "alert": {
      "alreadyLoggedIn": "Un utilisateur est déjà connecté. Merci de rafraîchir la page pour continuer.",
      "changePassword": "Votre mot de passe fait moins de 10 caractères. Pour protéger votre compte, merci de choisir un mot de passe plus long."
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
    "problem": {
      "401_2": "Anwani ya barua pepe na/au nenosiri si sahihi."
    }
  }
}
</i18n>
