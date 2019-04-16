<!--
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/opendatakit/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <tr>
    <td>
      <div class="project-list-project-name">
        <router-link :to="`/projects/${project.id}`">
          {{ project.name }} <span class="icon-angle-right"></span>
        </router-link>
      </div>
      <template v-if="projectCount === 1">
        <div v-if="project.name === 'Default Project' && project.forms === 0">
          <a href="#" @click.prevent="$emit('show-introduction', false)">
            What are Projects?
          </a>
        </div>
        <div v-else-if="project.name === 'Forms you made before projects existed'">
          <a href="#" @click.prevent="$emit('show-introduction', true)">
            What happened to my Forms?
          </a>
        </div>
      </template>
    </td>
    <td>{{ $pluralize('Form', project.forms, true) }}</td>
    <td>{{ latestSubmission }}</td>
  </tr>
</template>

<script>
import { formatDate } from '../../util/util';

export default {
  name: 'ProjectRow',
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
    latestSubmission() {
      return formatDate(this.project.lastSubmission, '(none)');
    }
  }
};
</script>

<style lang="sass">
@import '../../../assets/scss/variables';

#project-list-table {
  td {
    vertical-align: middle;

    .project-list-project-name a {
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
}
</style>
