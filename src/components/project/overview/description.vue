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
  <markdown-view v-if="!emptyDescription" id="project-overview-description"
    :raw-markdown="description"/>
  <div v-else-if="canUpdate" id="project-overview-description-update">
    <i18n tag="div" class="instructions" path="instructions.full">
      <template #projectSettings>
        <router-link :to="projectPath('settings')">{{ $t('instructions.projectSettings') }}</router-link>
      </template>
    </i18n>
    <div class="note">{{ $t('note') }}</div>
  </div>
</template>


<script>
import MarkdownView from '../../markdown/view.vue';
import routes from '../../../mixins/routes';

export default {
  name: 'ProjectOverviewDescription',
  components: { MarkdownView },
  mixins: [routes()],
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
      type: Boolean
    }
  },
  computed: {
    emptyDescription() {
      return this.description === '' || this.description == null;
    }
  }
};
</script>


<style lang="scss">
@import '../../../assets/scss/mixins';

#project-overview-description, #project-overview-description-update {
  border-left: 5px solid #ccc;
  padding-left: 12px;
  margin-bottom: 20px;
}

#project-overview-description {
  font-size: 18px;
  line-height: 1.2;

  /*
    The markdown html can include tags like `<h1>`s with their
    own top margins, which were messing up the appearance of this
    description box (space above and gray border to the left).
  */
  & > :first-child {
    margin-top: 0px;
  }
}

#project-overview-description-update {
  font-style: italic;

  .instructions {
    font-size: 16px;
  }
  .note {
    font-size: 13px;
  }
}

</style>

<i18n lang="json5">
{
  "en": {
    // This is shown in place of an empty project description and serves as a
    // guide for where and how to change the description.
    "instructions": {
      "full": "Add Project notes, links, instructions and other resources to this space in {projectSettings}.",
      "projectSettings": "Project Settings"
    },
    // This note is also shown with an empty project description explaining who
    // sees the message and can take action on it.
    "note": "Only Project Managers can see this suggestion."
  }
}
</i18n>
