<!-- This component renders the skeleton of an account page, using the server
config related to the login page. The component expects to receive the page
content in a slot, which the component will style. -->
<template>
  <div id="account-page-container" :inert="preview">
    <div id="account-page-container-left">
      <div>
        <div id="account-page-container-logo">
          <!-- This will load the default logo eagerly, even before the response
          for serverConfig has been received. The goal is to show the default
          logo more quickly if a custom logo isn't configured. -->
          <img v-if="logoUrl == null" src="../../../assets/images/odk-logo.png"
            :alt="$t('login.odkLogo')" v-on="imgHandlers">
          <img v-else :src="logoUrl"
            :alt="$t('customLogoAlt')" v-on="imgHandlers">
          <spinner/>
        </div>
        <div id="account-page-container-main"><slot></slot></div>
      </div>
    </div>
    <div id="account-page-container-hero" :class="hiddenClass">
      <img v-if="heroUrl == null" src="../../../assets/images/account/default-hero.png"
        :alt="$t('defaultHeroAlt')" v-on="imgHandlers">
      <img v-else :src="heroUrl"
        :alt="$t('customHeroAlt')" v-on="imgHandlers">
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

import Spinner from '../../spinner.vue';

import { apiPaths } from '../../../util/request';
import { useRequestData } from '../../../request-data';

defineOptions({
  name: 'AccountPageContainer'
});
const props = defineProps({
  // `true` if the component is being previewed in ConfigLoginPreview
  preview: Boolean
});

// The component does not assume that this data will exist when the component is
// created.
const { serverConfig } = useRequestData();

const blobUrl = (key) => computed(() => {
  if (!serverConfig.dataExists) return null;
  const config = serverConfig[key];
  if (config == null || !config.blobExists) return null;
  // The `ts` query parameter isn't for Backend: it's for cache-busting.
  return apiPaths.publicConfig(key, { ts: Date.parse(config.setAt) });
});
const logoUrl = blobUrl('logo');
const heroUrl = blobUrl('hero-image');

const imgHandlers = {
  // eslint-disable-next-line no-param-reassign
  load: (event) => { event.target.dataset.loaded = 'true'; },
  // eslint-disable-next-line no-param-reassign
  error: (event) => { event.target.dataset.error = 'true'; }
};

// The preview is a fixed width, then scaled to fit its container, so it doesn't
// need to be responsive.
const hiddenClass = computed(() => (props.preview ? null : 'hidden-xs hidden-sm'));
</script>

<style lang="scss">
@use 'sass:color';
@use 'sass:math';
@import '../../../assets/scss/variables';

/*
Notes about the layout:

- #account-page-container-left is vertically centered.
- #account-page-container-hero will use all the height available to it, but it
  should not increase the overall height. In other words, it should never create
  a vertical scrollbar.
- In contrast, #account-page-container-left may create a scrollbar if the
  viewport is too short.
*/

#account-page-container {
  display: flex;
  background-color: #fff;
}

#account-page-container-left {
  // Use all the width available -- either 50% if the viewport is wide enough to
  // show the hero image, or 100% if the hero image is not shown.
  flex-basis: 0;
  flex-grow: 1;

  // Center vertically.
  align-self: center;

  > div {
    // Center horizontally.
    margin-inline: auto;
    // Prevent .form-control elements from growing too wide.
    max-width: 469px;
  }

  padding-block: 70px;
  padding-inline: math.div(1, 12) * 100%;
}

#account-page-container-logo, #account-page-container-hero {
  img {
    // Prevent images from flashing; fade them into view.
    opacity: 0;
    &[data-loaded] { opacity: 1; }
    transition: opacity 0.45s;
  }
}

#account-page-container-logo {
  img {
    max-width: 130px;
    max-height: 130px;
  }

  &:not(:has(img[data-loaded])):not(:has(img[data-error])) {
    // We show a placeholder while the logo is loading so that the page content
    // below it doesn't jump.
    background-color: color.scale(#f5f9ff, $lightness: -4%);
    border-radius: 2px;

    // Choosing this number based on the assumption that most logos will be at
    // least this tall.
    height: 95px;
    width: 95px;

    // Fade the placeholder into view in case the image loads quickly; prevent
    // the placeholder from flashing away.
    @keyframes account-page-container-logo {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    animation-duration: 0.3s;
    animation-iteration-count: 1;
    animation-name: account-page-container-logo;
  }
  &:has(img[data-loaded]) .spinner { display: none; }
  &:has(img[data-error]) { display: none; }

  margin-bottom: 40px;
  // Needed for Spinner.
  position: relative;
}

#account-page-container-hero {
  width: 50%;
  position: relative;

  img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

#account-page-container-main {
  $margin-after-title: 40px;

  h1 {
    font-size: 24px;
    letter-spacing: normal;
    line-height: inherit;
    margin-block: 0 $margin-after-title;
  }

  // Subtitle (optional). The slot may or may not render this element.
  h1 + p {
    font-size: 16px;
    line-height: 20px;
    // Undo the bottom margin on the title, then add it to the subtitle.
    margin-block: #{10px - $margin-after-title} $margin-after-title;

    &:empty { display: none; }
  }

  // Using :where() to decrease specificity, so that the default border-color
  // applies when the .form-control is focused.
  :where(&) .form-group .form-control {
    background-color: #fff;
    border-width: 1px;
    border-color: #eee;
    border-radius: 2px;

    &::placeholder { color: $color-input-inactive; }
  }

  form > div:has(.btn + .btn) {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 26px;
  }

  // Removing padding-inline so that the buttons will be aligned if they wrap.
  .btn-link { padding-inline: 0; }
}
</style>

<i18n lang="json5">
{
  "en": {
    "customLogoAlt": "Organization logo",
    "defaultHeroAlt": "Features of ODK Central",
    "customHeroAlt": "Welcome image"
  }
}
</i18n>
