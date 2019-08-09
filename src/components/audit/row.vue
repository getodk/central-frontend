<!--
Copyright 2019 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/opendatakit/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <tr class="audit-row">
    <td>{{ loggedAt }}</td>
    <td>
      <template v-if="action != null">
        {{ action.type[0] }}
        <template v-if="action.type.length !== 1">
          <span class="icon-angle-right"></span> {{ action.type[1] }}
        </template>
      </template>
      <template v-else>
        {{ audit.action }}
      </template>
    </td>
    <td class="initiator">
      <router-link v-if="audit.actor != null"
        :to="`/users/${audit.actor.id}/edit`" :title="audit.actor.displayName">
        {{ audit.actor.displayName }}
      </router-link>
    </td>
    <td class="target">
      <router-link v-if="action != null && action.target != null"
        :to="action.target.path(audit.actee)" :title="targetTitle">
        {{ targetTitle }}
      </router-link>
    </td>
    <td class="details">
      <!-- Adding a <div> to work around a Firefox bug: see
      https://bugzilla.mozilla.org/show_bug.cgi?id=386970. -->
      <div ref="details" @click="selectDetails">{{ details }}</div>
    </td>
  </tr>
</template>

<script>
import { formatDate } from '../../util/util';

const TARGETS = {
  user: {
    titleProp: 'displayName',
    path: ({ id }) => `/users/${id}/edit`
  },
  project: {
    titleProp: 'name',
    path: ({ id }) => `/projects/${id}`
  },
  form: {
    titleProp: 'name',
    path: ({ projectId, xmlFormId }) =>
      `/projects/${projectId}/forms/${xmlFormId}`
  }
};
const ACTIONS = {
  'user.create': {
    type: ['User', 'Create'],
    target: TARGETS.user
  },
  'user.update': {
    type: ['User', 'Update Details'],
    target: TARGETS.user
  },
  'assignment.create': {
    type: ['User', 'Assign Role'],
    target: TARGETS.user
  },
  'assignment.delete': {
    type: ['User', 'Revoke Role'],
    target: TARGETS.user
  },
  'user.delete': {
    type: ['User', 'Retire'],
    target: TARGETS.user
  },
  'project.create': {
    type: ['Project', 'Create'],
    target: TARGETS.project
  },
  'project.update': {
    type: ['Project', 'Update Details'],
    target: TARGETS.project
  },
  'project.delete': {
    type: ['Project', 'Delete'],
    target: TARGETS.project
  },
  'form.create': {
    type: ['Form', 'Create'],
    target: TARGETS.form
  },
  'form.update': {
    type: ['Form', 'Update Details'],
    target: TARGETS.form
  },
  'form.attachment.update': {
    type: ['Form', 'Update Attachments'],
    target: TARGETS.form
  },
  'form.delete': {
    type: ['Form', 'Delete'],
    target: TARGETS.form
  },
  backup: {
    type: ['Backup']
  }
};

export default {
  name: 'AuditRow',
  props: {
    audit: {
      type: Object,
      required: true
    }
  },
  computed: {
    loggedAt() {
      return formatDate(this.audit.loggedAt);
    },
    action() {
      return ACTIONS[this.audit.action];
    },
    targetTitle() {
      return this.audit.actee[this.action.target.titleProp];
    },
    details() {
      return this.audit.details != null
        ? JSON.stringify(this.audit.details)
        : '';
    }
  },
  methods: {
    selectDetails() {
      if (this.audit.details == null) return;
      const selection = window.getSelection();
      // Select the entire JSON unless the user has selected specific text.
      if (selection.isCollapsed)
        selection.selectAllChildren(this.$refs.details);
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

.audit-row {
  td {
    vertical-align: middle;
  }

  .icon-angle-right {
    font-size: 8px;
    vertical-align: 1px;
  }

  .initiator, .target {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .details div {
    font-family: $font-family-monospace;
    overflow-x: auto;
    white-space: nowrap;
  }
}
</style>
