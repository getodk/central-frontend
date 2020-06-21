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
  <modal :state="state" backdrop hideable @hide="$emit('hide')">
    <template #title>{{ $t('title') }}</template>
    <template #body>
      <div class="modal-introduction">
        <i18n tag="p" path="introduction[0].full">
          <template #projects>
            <strong>{{ $t('introduction[0].projects') }}</strong>
          </template>
        </i18n>
        <i18n tag="p" path="introduction[1].full">
          <template #forms>
            <strong>{{ $t('introduction[1].forms') }}</strong>
          </template>
          <template #appUsers>
            <strong>{{ $t('introduction[1].appUsers') }}</strong>
          </template>
        </i18n>
        <i18n tag="p" path="moreInfo.helpArticle.full">
          <template #helpArticle>
            <doc-link to="central-projects/">{{ $t('moreInfo.helpArticle.helpArticle') }}</doc-link>
          </template>
        </i18n>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-primary" @click="$emit('hide')">
          {{ $t('action.ok') }}
        </button>
      </div>
    </template>
  </modal>
</template>

<script>
import DocLink from '../doc-link.vue';
import Modal from '../modal.vue';

export default {
  name: 'ProjectIntroduction',
  components: { DocLink, Modal },
  props: {
    state: {
      type: Boolean,
      default: false
    }
  }
};
</script>

<i18n lang="json5">
{
  "en": {
    // This is the title at the top of a pop-up.
    "title": "Introducing Projects",
    "introduction": [
      {
        "full": "ODK Central Beta v0.4 introduced {projects}.",
        "projects": "Projects"
      },
      {
        "full": "Projects group {forms} and {appUsers} together to make them easier to organize and manage, both on this website and on your data collection device.",
        "forms": "Forms",
        "appUsers": "App Users"
      }
    ]
  }
}
</i18n>
