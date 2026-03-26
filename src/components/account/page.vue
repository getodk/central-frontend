<template>
  <div id="account-page" ref="el">
    <page-body v-if="loadError == null">
      <loading :state="serverConfig.initiallyLoading"/>
      <account-page-container v-show="serverConfig.dataExists">
        <router-view/>
      </account-page-container>
    </page-body>
    <config-error v-else :error="loadError"/>
  </div>
</template>

<script setup>
import { nextTick, ref, shallowRef, watchEffect } from 'vue';

import AccountPageContainer from './page/container.vue';
import ConfigError from '../config-error.vue';
import PageBody from '../page/body.vue';
import Loading from '../loading.vue';

import useEventListener from '../../composables/event-listener';
import { px, styleBox } from '../../util/dom';
import { useRequestData } from '../../request-data';

defineOptions({
  name: 'AccountPage'
});

const { serverConfig } = useRequestData();

const loadError = shallowRef(null);
serverConfig.request({ url: '/v1/config/public', alert: false })
  .catch(error => { loadError.value = error; });

const el = ref(null);
// Stretches the page to the bottom of the viewport if it doesn't reach it
// naturally.
const resize = () => {
  const container = el.value.querySelector('#account-page-container');
  // Undo the effect of the previous call to resize().
  container.style.minHeight = '';

  const rect = container.getBoundingClientRect();
  if (rect.height === 0) return;

  const { clientHeight } = document.documentElement;
  const { marginBottom } = styleBox(getComputedStyle(container));
  container.style.minHeight = px(clientHeight - rect.top - marginBottom);
};
watchEffect(() => { if (serverConfig.dataExists) nextTick(resize); });
useEventListener(window, 'resize', resize);
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#account-page {
  margin-inline: -$padding-inline-container;

  #account-page-container {
    margin-block: -$margin-top-page-body (-$box-shadow-offset-y-body);
  }
}
</style>
