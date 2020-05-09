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
  <tr class="audit-row">
    <td>{{ loggedAt }}</td>
    <td>
      <template v-if="actionInfo != null">
        {{ actionInfo.type[0] }}
        <template v-if="actionInfo.type.length !== 1">
          <span class="icon-angle-right"></span> {{ actionInfo.type[1] }}
        </template>
      </template>
      <template v-else>
        {{ audit.action }}
      </template>
    </td>
    <td class="initiator">
      <router-link v-if="audit.actor != null" :to="userPath(audit.actor.id)"
        :title="audit.actor.displayName">
        {{ audit.actor.displayName }}
      </router-link>
    </td>
    <td class="target">
      <router-link v-if="targetInfo != null" :to="targetInfo.path(audit.actee)"
        :title="targetTitle">
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
import Form from '../../presenters/form';
import routes from '../../mixins/routes';
import { formatDate } from '../../util/date-time';

const ACTIONS = {
  'user.create': {
    type: ['User', 'Create'],
    target: 'user'
  },
  'user.update': {
    type: ['User', 'Update Details'],
    target: 'user'
  },
  'assignment.create': {
    type: ['User', 'Assign Role'],
    target: 'user'
  },
  'assignment.delete': {
    type: ['User', 'Revoke Role'],
    target: 'user'
  },
  'user.delete': {
    type: ['User', 'Retire'],
    target: 'user'
  },
  'project.create': {
    type: ['Project', 'Create'],
    target: 'project'
  },
  'project.update': {
    type: ['Project', 'Update Details'],
    target: 'project'
  },
  'project.delete': {
    type: ['Project', 'Delete'],
    target: 'project'
  },
  'form.create': {
    type: ['Form', 'Create'],
    target: 'form'
  },
  'form.update': {
    type: ['Form', 'Update Details'],
    target: 'form'
  },
  'form.update.draft.set': {
    type: ['Form', 'Create or Update Draft'],
    target: 'form'
  },
  'form.update.publish': {
    type: ['Form', 'Publish Draft'],
    target: 'form'
  },
  'form.update.draft.delete': {
    type: ['Form', 'Abandon Draft'],
    target: 'form'
  },
  'form.attachment.update': {
    type: ['Form', 'Update Attachments'],
    target: 'form'
  },
  'form.delete': {
    type: ['Form', 'Delete'],
    target: 'form'
  },
  backup: {
    type: ['Backup']
  }
};

export default {
  name: 'AuditRow',
  mixins: [routes()],
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
    actionInfo() {
      return ACTIONS[this.audit.action];
    },
    targets() {
      return {
        user: {
          title: ({ displayName }) => displayName,
          path: ({ id }) => this.userPath(id)
        },
        project: {
          title: ({ name }) => name,
          path: ({ id }) => this.projectPath(id)
        },
        form: {
          title: (form) => new Form(form).nameOrId(),
          path: (form) => this.primaryFormPath(form)
        }
      };
    },
    targetInfo() {
      if (this.actionInfo == null) return null;
      const { target } = this.actionInfo;
      return target != null ? this.targets[target] : null;
    },
    targetTitle() {
      return this.targetInfo.title(this.audit.actee);
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
  .table tbody & td {
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
