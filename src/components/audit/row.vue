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
      <router-link v-if="target != null" :to="target.path"
        :title="target.title">
        {{ target.title }}
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

const typeByCategory = {
  user: i18n.t('common.user'),
  assignment: i18n.t('common.user'),
  project: i18n.t('common.project'),
  form: i18n.t('common.form'),
  upgrade: i18n.t('audit.category.upgrade')
};

const acteeSpeciesByCategory = {
  user: {
    title: ({ displayName }) => displayName,
    path: ({ id }, vm) => vm.userPath(id)
  },
  project: {
    title: ({ name }) => name,
    path: ({ id }, vm) => vm.projectPath(id)
  },
  form: {
    title: (form) => new Form(form).nameOrId(),
    path: (form, vm) => vm.primaryFormPath(form)
  }
};
acteeSpeciesByCategory.assignment = acteeSpeciesByCategory.user;
// Presumably at some point, the actee of an upgrade audit might not be a form,
// at which point we will have to update this component (perhaps we would use
// the full action or a prefix instead of the category).
acteeSpeciesByCategory.upgrade = acteeSpeciesByCategory.form;

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
    type() {
      const actionMessage = auditActionMessage(this.audit.action);
      if (actionMessage == null) return [this.audit.action];
      return this.category != null
        ? [typeByCategory[this.category], actionMessage]
        : [actionMessage];
    },
    target() {
      if (this.category == null) return null;
      const species = acteeSpeciesByCategory[this.category];
      if (species == null) return null;
      const { actee } = this.audit;
      return {
        path: species.path(actee, this),
        title: species.title(actee)
      };
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
