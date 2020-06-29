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
  <tr :class="{ archived: project.archived }">
    <td>
      <div class="project-row-name">
        <router-link :to="projectPath(project.id)">
          {{ project.nameWithArchived() }}
          <span class="icon-angle-right"></span>
        </router-link>
      </div>
      <div v-if="showsIntroductionLink">
        <a href="#" @click.prevent="$emit('show-introduction')">
          {{ $t('help') }}
        </a>
      </div>
    </td>
    <td>{{ $tcn('count.form', project.forms) }}</td>
    <td>
      <date-time :iso="project.lastSubmission" :blank="$t('noSubmission')"/>
    </td>
  </tr>
</template>

<script>
import DateTime from '../date-time.vue';
import routes from '../../mixins/routes';

export default {
  name: 'ProjectRow',
  components: { DateTime },
  mixins: [routes()],
  props: {
    projectCount: {
      type: Number,
      required: true
    },
    project: {
      type: Object,
      required: true
    }
  },
  computed: {
    showsIntroductionLink() {
      return this.projectCount === 1 &&
        this.project.name === 'Default Project' && this.project.forms === 0;
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#project-list-table {
  td {
    vertical-align: middle;

    .project-row-name a {
      color: inherit;
      font-size: 24px;
      text-decoration: none;

      .icon-angle-right {
        color: $color-accent-primary;
        font-size: 20px;
        margin-left: 2px;
        margin-right: 0;
      }
    }
  }

  .archived {
    color: #999;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    "help": "What are Projects?",
    // This text is shown under the "Latest Submission" column of the Projects
    // table. It is shown for a Project with no Submissions.
    "noSubmission": "(none)"
  }
}
</i18n>
