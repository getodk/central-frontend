<template>
  <div id="config-login">
    <p id="config-login-title">{{ $t('title') }}</p>
    <loading :state="serverConfig.awaitingResponse"/>
    <div v-if="refreshed" class="row">
      <div class="col-xs-5">
        <config-login-edit/>
      </div>
      <div class="col-xs-5 col-xs-offset-2">
        <!-- TODO preview -->
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

import ConfigLoginEdit from './login/edit.vue';
import Loading from '../loading.vue';

import { noop } from '../../util/util';
import { useRequestData } from '../../request-data';

defineOptions({
  name: 'ConfigLogin'
});

const { serverConfig } = useRequestData();

const refreshed = ref(false);
serverConfig.request({ url: '/v1/config/public', clear: false })
  .then(() => { refreshed.value = true; })
  .catch(noop);
</script>

<style lang="scss">
#config-login-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 40px;
}
</style>

<i18n lang="json5">
{
  "en": {
    "title": "Login page"
  }
}
</i18n>
