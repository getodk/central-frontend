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
        <a href="#" @click.prevent>
          <!-- TODO. Update the icon. -->
          <span class="icon-question-circle"></span>{{ $t('enabled.true[1]') }}
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
