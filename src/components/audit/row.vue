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
    <td><date-time :iso="audit.loggedAt"/></td>
    <td>
      {{ type[0] }}
      <template v-if="type.length > 1">
        <span class="icon-angle-right"></span> {{ type[1] }}
      </template>
    </td>
    <td class="initiator">
      <router-link v-if="audit.actor != null" :to="userPath(audit.actor.id)"
        :title="audit.actor.displayName">
        {{ audit.actor.displayName }}
      </router-link>
    </td>
    <td class="target">
      <router-link v-if="acteeSpecies != null" :to="acteePath"
        :title="acteeTitle">
        {{ acteeTitle }}
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
import DateTime from '../date-time.vue';
import Form from '../../presenters/form';
import i18n from '../../i18n';
import routes from '../../mixins/routes';
import { auditActionMessage } from '../../util/i18n';

const acteeSpeciesByCategory = {
  user: {
    title: () => i18n.t('common.user'),
    acteeTitle: ({ displayName }) => displayName,
    acteePath: ({ id }, vm) => vm.userPath(id)
  },
  project: {
    title: () => i18n.t('common.project'),
    acteeTitle: ({ name }) => name,
    acteePath: ({ id }, vm) => vm.projectPath(id)
  },
  form: {
    title: () => i18n.t('common.form'),
    acteeTitle: (form) => new Form(form).nameOrId(),
    acteePath: (form, vm) => vm.primaryFormPath(form)
  }
};
acteeSpeciesByCategory.assignment = acteeSpeciesByCategory.user;

export default {
  name: 'AuditRow',
  components: { DateTime },
  mixins: [routes()],
  props: {
    audit: {
      type: Object,
      required: true
    }
  },
  computed: {
    category() {
      const index = this.audit.action.indexOf('.');
      return index !== -1 ? this.audit.action.slice(0, index) : null;
    },
    acteeSpecies() {
      return this.category != null
        ? acteeSpeciesByCategory[this.category]
        : null;
    },
    type() {
      const actionMessage = auditActionMessage(this.audit.action);
      if (actionMessage == null) return [this.audit.action];
      return this.acteeSpecies != null
        ? [this.acteeSpecies.title(), actionMessage]
        : [actionMessage];
    },
    acteePath() {
      return this.acteeSpecies != null
        ? this.acteeSpecies.acteePath(this.audit.actee, this)
        : null;
    },
    acteeTitle() {
      return this.acteeSpecies != null
        ? this.acteeSpecies.acteeTitle(this.audit.actee)
        : null;
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
