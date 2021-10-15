<!--
Copyright 2021 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <form id="analytics-form" @submit.prevent="submit">
    <div class="radio">
      <label>
        <input v-model="enabled" type="radio" :value="null"
          aria-describedby="analytics-form-enabled-null-help">
        <strong>{{ $t('enabled.null[0]') }}</strong>
      </label>
      <p id="analytics-form-enabled-null-help" class="help-block">
        {{ $t('enabled.null[1]') }}
      </p>
    </div>
    <div class="radio">
      <label>
        <input v-model="enabled" type="radio" :value="false"
          aria-describedby="analytics-form-enabled-false-help">
        <strong>{{ $t('enabled.false[0]') }}</strong>
      </label>
      <p id="analytics-form-enabled-false-help" class="help-block">
        {{ $t('enabled.false[1]') }}
      </p>
    </div>
    <div class="radio">
      <label>
        <input v-model="enabled" type="radio" :value="true">
        <i18n :tag="false" path="enabled.true[0].full">
          <template #weWillShare>
            <strong>{{ $t('enabled.true[0].weWillShare') }}</strong>
          </template>
          <template #termsOfService>
            <a href="https://getodk.org/legal/tos.html" target="_blank">{{ $t('enabled.true[0].termsOfService') }}</a>
          </template>
          <template #privacyPolicy>
            <a href="https://getodk.org/legal/privacy.html" target="_blank">{{ $t('enabled.true[0].privacyPolicy') }}</a>
          </template>
        </i18n>
      </label>
      <p id="analytics-form-enabled-true-help" class="help-block">
        <a href="#" @click.prevent="$emit('preview')">
          <span class="icon-question-circle-o"></span>{{ $t('enabled.true[1]') }}
        </a>
      </p>
    </div>
    <fieldset :disabled="enabled !== true">
      <div class="checkbox">
        <label>
          <input v-model="contact" type="checkbox"
            aria-describedby="analytics-form-contact-help">
          <strong>{{ $t('contact[0]') }}</strong>
        </label>
        <p id="analytics-form-contact-help" class="help-block">
          {{ $t('contact[1]') }}
        </p>
      </div>
      <fieldset :disabled="!contact">
        <form-group v-model.trim="email" type="email"
          :placeholder="$t('field.workEmail')" required autocomplete="off"/>
        <form-group v-model.trim="organization"
          :placeholder="$t('field.organization')" autocomplete="organization"/>
      </fieldset>
    </fieldset>
    <button type="submit" class="btn btn-primary" :disabled="awaitingResponse">
      {{ $t('action.saveSettings') }} <spinner :state="awaitingResponse"/>
    </button>
  </form>
</template>

<script>
import FormGroup from '../form-group.vue';
import Spinner from '../spinner.vue';

import Option from '../../util/option';
import request from '../../mixins/request';
import { noop } from '../../util/util';

export default {
  name: 'AnalyticsForm',
  components: { FormGroup, Spinner },
  mixins: [request()],
  data() {
    const requestData = this.$store.state.request.data;
    const configValue = requestData.analyticsConfig
      .map(({ value }) => value)
      .orElseGet(() => ({ enabled: null }));
    return {
      awaitingResponse: false,
      enabled: configValue.enabled,
      contact: configValue.email != null || configValue.organization != null,
      email: configValue.email != null
        ? configValue.email
        : (configValue.organization == null ? requestData.currentUser.email : ''),
      organization: configValue.organization != null
        ? configValue.organization
        : ''
    };
  },
  methods: {
    async setConfig() {
      const postData = { enabled: this.enabled };
      if (this.enabled && this.contact) {
        if (this.email !== '') postData.email = this.email;
        if (this.organization !== '')
          postData.organization = this.organization;
      }
      const response = await this.post('/v1/config/analytics', postData);
      this.$store.commit('setData', {
        key: 'analyticsConfig',
        value: Option.of(response.data)
      });
    },
    async unsetConfig() {
      await this.request({ method: 'DELETE', url: '/v1/config/analytics' });
      this.$store.commit('setData', {
        key: 'analyticsConfig',
        value: Option.none()
      });
    },
    submit() {
      (this.enabled != null ? this.setConfig() : this.unsetConfig())
        .then(() => {
          this.$alert().success(this.$t('alert.success'));
        })
        .catch(noop);
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#analytics-form {
  margin-bottom: $margin-bottom-page-section;

  .radio { margin-bottom: 21px; }
  .help-block { color: $color-text; }
  fieldset { padding-left: 20px; }
  > fieldset { margin-top: -6px; }
  fieldset fieldset { margin-bottom: 5px; }
  .form-control { width: 375px; }
}

#analytics-form-enabled-true-help { margin-top: 12px; }
</style>

<i18n lang="json5">
{
  "en": {
    "enabled": {
      "null": [
        "Remind us later.",
        "Administrators will continue to see the message at the top of the screen."
      ],
      "true": [
        {
          "full": "{weWillShare} and we accept the {termsOfService} and {privacyPolicy}.",
          "weWillShare": "We are willing to share anonymous usage data monthly with the Central team,",
          "termsOfService": "Terms of Service",
          "privacyPolicy": "Privacy Policy"
        },
        "What metrics are sent?"
      ],
      "false": [
        "We are not interested in sharing any information.",
        "You won’t see a reminder about this again."
      ]
    },
    "contact": [
      "I am willing to include my contact information with the report.",
      "We may contact you to learn more about your usage of Central."
    ],
    "field": {
      "workEmail": "Work email address",
      "organization": "Organization name"
    },
    "alert": {
      "success": "Settings saved!"
    }
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "enabled": {
      "null": [
        "Připomeňte nám to později.",
        "Správci budou i nadále zobrazovat zprávu v horní části obrazovky."
      ],
      "true": [
        {
          "full": "{weWillShare} a přijímáme {termsOfService} a {privacyPolicy}.",
          "weWillShare": "Jsme ochotni měsíčně sdílet anonymní údaje o používání s centrálním týmem,",
          "termsOfService": "Podmínky služby",
          "privacyPolicy": "Zásady ochrany osobních údajů"
        },
        "Jaké metriky se odesílají?"
      ],
      "false": [
        "Nemáme zájem sdílet žádné informace.",
        "Tuto připomínku už neuvidíte."
      ]
    },
    "contact": [
      "Jsem ochoten připojit ke zprávě své kontaktní údaje.",
      "Můžeme vás kontaktovat, abychom se dozvěděli více o vašem používání služby Central."
    ],
    "field": {
      "workEmail": "Pracovní e-mailová adresa",
      "organization": "Název organizace"
    },
    "alert": {
      "success": "Nastavení uloženo!"
    }
  },
  "es": {
    "enabled": {
      "null": [
        "Recuérdanos más tarde.",
        "Los administradores seguirán viendo el mensaje en la parte superior de la pantalla."
      ],
      "true": [
        {
          "full": "{weWillShare} y aceptamos los {termsOfService} y {privacyPolicy}",
          "weWillShare": "Estamos dispuestos a compartir mensualmente datos de uso anónimos con el equipo central,",
          "termsOfService": "Términos del servicio",
          "privacyPolicy": "Política de privacidad"
        },
        "¿Qué métricas se envían?"
      ],
      "false": [
        "No estamos interesados en compartir ninguna información.",
        "No volverá a ver un recordatorio sobre esto."
      ]
    },
    "contact": [
      "Estoy dispuesto a incluir mi información de contacto con el informe.",
      "Es posible que nos comuniquemos con usted para obtener más información sobre su uso de Central."
    ],
    "field": {
      "workEmail": "Dirección de correo electrónico del trabajo",
      "organization": "Nombre de la Organización"
    },
    "alert": {
      "success": "¡Configuración guardada!"
    }
  },
  "fr": {
    "enabled": {
      "null": [
        "Nous le rappeler plus tard.",
        "Les administrateurs continueront à voir le message en haut de l'écran."
      ],
      "true": [
        {},
        "Quelles sont les métriques envoyées ?"
      ],
      "false": [
        "Nous ne sommes pas intéressés par le partage de ces informations.",
        "Vous ne verrez plus de rappel à ce sujet."
      ]
    },
    "contact": [
      "Je souhaite inclure mes informations de contact dans le rapport.",
      "Nous pouvons vous contacter pour en savoir plus sur votre utilisation de Central."
    ],
    "field": {
      "workEmail": "Adresse de courriel professionnelle",
      "organization": "Nom de l'organisation"
    },
    "alert": {
      "success": "Réglages enregistrés."
    }
  },
  "id": {
    "alert": {
      "success": "Pengaturan disimpan!"
    }
  },
  "it": {
    "enabled": {
      "null": [
        "Ricordacelo dopo",
        "Gli amministratori continueranno a vedere il messaggio nella parte superiore dello schermo."
      ],
      "true": [
        {
          "full": "{weWillShare} e accettiamo i {termsOfService} e {privacyPolicy}.",
          "weWillShare": "Siamo disposti a condividere mensilmente dati di utilizzo anonimi con il team Central,",
          "termsOfService": "Termini di servizio",
          "privacyPolicy": "Politica sulla Privacy."
        },
        "Quali metriche vengono inviate?"
      ],
      "false": [
        "Non siamo interessati a condividere alcuna informazione.",
        "Non vedrai più un promemoria al riguardo."
      ]
    },
    "contact": [
      "Sono disposto a includere le mie informazioni di contatto con il rapporto.",
      "Potremmo contattarti per capire meglio sul tuo utilizzo di Central"
    ],
    "field": {
      "workEmail": "Indirizzo email del lavoro",
      "organization": "Nome dell'Organizzazione"
    },
    "alert": {
      "success": "Impostazioni salvate!"
    }
  }
}
</i18n>
