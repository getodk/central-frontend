<template>
  <div id="config-login-preview">
    <p id="config-login-preview-title">{{ $t('title') }}</p>
    <p>{{ $t('introduction') }}</p>
    <div id="config-login-preview-scaler" ref="scaler">
      <account-page-container preview>
        <account-login preview/>
      </account-page-container>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';

import AccountLogin from '../../account/login.vue';
import AccountPageContainer from '../../account/page/container.vue';

import useEventListener from '../../../composables/event-listener';

defineOptions({
  name: 'ConfigLoginPreview'
});

const scaler = ref(null);
const rescale = () => {
  // Remove the effect of the previous call to rescale().
  scaler.value.style.transform = '';

  const scalerWidth = scaler.value.getBoundingClientRect().width;
  const unscaledWidth = scaler.value.children[0].getBoundingClientRect().width;
  const scale = scalerWidth / unscaledWidth;
  scaler.value.style.transform = `scale(${scale})`;
};
onMounted(rescale);
useEventListener(window, 'resize', rescale);
</script>

<style lang="scss">
#config-login-preview-title {
  font-size: 16px;

  + p { margin-bottom: 15px; }
}

#config-login-preview-scaler {
  transform-origin: top left;

  #account-page-container {
    width: 1280px;
    min-height: 720px;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    // @transifexKey component.MarkdownTextarea.preview
    "title": "Preview",
    "introduction": "This is what your login page looks like right now:"
  }
}
</i18n>
