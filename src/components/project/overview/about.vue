<!--
Copyright 2019 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <page-section>
    <template #heading>
      <span>{{ $t('title') }}</span>
    </template>
    <template #body>
      <p>{{ $t('body[0]') }}</p>
      <p>{{ $t('body[1]') }}</p>
      <i18n tag="p" path="body[2].full">
        <template #helpArticle>
          <doc-link to="central-projects/">{{ $t('body[2].helpArticle') }}</doc-link>
        </template>
        <template #forumThread>
          <a href="https://forum.getodk.org/t/-/19677" target="_blank">{{ $t('body[2].forumThread') }}</a>
        </template>
      </i18n>
    </template>
  </page-section>
</template>

<script>
import DocLink from '../../doc-link.vue';
import PageSection from '../../page/section.vue';

export default {
  name: 'ProjectOverviewAbout',
  components: { DocLink, PageSection }
};
</script>

<i18n lang="json5">
{
  "en": {
    "title": "About Projects",
    "body": [
      "Any Forms you create in this Project will only be visible on data collection devices to App Users who are a part of this Project.",
      "Future releases of ODK Central will add more Project-centric features, including improvements to Form states and workflow, device state updates, Collect settings management, and more granular permissioning.",
      {
        "full": "For more information, please see {helpArticle}, and if you have any feedback please visit {forumThread}.",
        "helpArticle": "this help article",
        "forumThread": "this forum thread"
      }
    ]
  }
}
</i18n>
