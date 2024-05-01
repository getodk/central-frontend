<!--
Copyright 2024 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div id="config-error" class="row">
    <div class="col-xs-12 col-sm-offset-3 col-sm-6">
      <div class="panel panel-default panel-main">
        <div class="panel-heading">
          <h1 class="panel-title">{{ $t('title') }}</h1>
        </div>
        <div class="panel-body">
          <p>
            <span>{{ $t('body') }}</span>
            <sentence-separator/>
            <span>{{ loadError }}</span>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { F } from 'ramda';
import { computed, inject } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';

import SentenceSeparator from './sentence-separator.vue';

import { requestAlertMessage } from '../util/request';

defineOptions({
  name: 'ConfigError'
});

// Since there was an error loading the config, we don't even know how to render
// the login page (since we don't know config.oidcEnabled). Here, we prevent the
// user from leaving the page.
onBeforeRouteLeave(F);

const { i18n, config } = inject('container');
const loadError = computed(() => requestAlertMessage(i18n, config.loadError));
</script>

<i18n lang="json5">
{
  "en": {
    // This is the title at the top of a panel.
    "title": "Error Loading Central",
    "body": "There was an error loading Central."
  }
}
</i18n>
