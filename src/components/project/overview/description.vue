<!--
Copyright 2022 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.
This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div>
    <template v-if="description != null">
      <markdown-view v-if="description != null" id="project-overview-description"
        :raw-markdown="description"/>
    </template>
    <template v-else>
      <div v-if="canUpdate" id="project-overview-description-update">
        <div class="instructions">{{ $t('instructions') }}</div>
        <div class="note">{{ $t('note') }}</div>
      </div>
    </template>
  </div>
</template>


<script>
import MarkdownView from '../../markdown/view.vue';

export default {
  name: 'ProjectOverviewDescription',
  components: { MarkdownView },
  props: {
    description: {
      type: String
    },
    // This canUpdate boolean is set by the parent project/overview.vue
    // component based on user's permissions on the project.
    // If the description is blank, they will see an explanation and
    // edit link if they are a manager and can update the project.
    // If the description is blank and they don't have permission,
    // nothing will be shown in this description component.
    canUpdate: {
      type: Boolean,
      defaut: false
    }
  }
};
</script>


<style lang="scss">
@import '../../../assets/scss/mixins';

#project-overview-description, #project-overview-description-update {
  overflow: hidden;
  box-sizing: border-box;
  border-left: 5px solid #ccc;
  padding-left: 12px;
  margin-bottom: 12px;
}

#project-overview-description {
  font-size: 18px;
}

#project-overview-description > p {
  max-width: 80%;
}

#project-overview-description-update {
  .instructions {
    font-size: 21px;
    font-style: italic;
  }
  .note {
    font-size: 15px;
    font-style: italic;
  }
}

</style>

<i18n lang="json5">
{
  "en": {
    // This is shown in place of an empty project description and serves as a
    // guide for where and how to change the description.
    "instructions": "Add your own notes, links, instructions and other resources to this space in Project Settings. (todo: make link)",
    // This note is also shown with an empty project description explaining who
    // sees the message and can take action on it.
    "note": "Only Project Managers can see this message."
  }
}
</i18n>
