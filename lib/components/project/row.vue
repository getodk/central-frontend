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
    <td class="project-list-project-name">
      <router-link :to="`/projects/${project.id}`">
        {{ project.name }} <span class="icon-angle-right"></span>
      </router-link>
    </td>
    <td>{{ $pluralize('form', project.forms, true) }}</td>
    <td>{{ latestSubmission }}</td>
  </tr>
</template>

<script>
import { formatDate } from '../../util';

export default {
  name: 'ProjectRow',
  props: {
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
