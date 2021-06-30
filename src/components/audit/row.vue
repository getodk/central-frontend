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
    <td class="type">
      {{ type[0] }}
      <template v-if="type.length > 1">
        <span class="icon-angle-right"></span> {{ type[1] }}
      </template>
    </td>
    <td class="initiator">
      <actor-link v-if="audit.actor != null" :actor="audit.actor"/>
    </td>
    <td class="target">
      <template v-if="target != null">
        <router-link v-if="target.path != null" :to="target.path"
          :title="target.title">
          {{ target.title }}
        </router-link>
        <span v-else :title="target.title">{{ target.title }}</span>
      </template>
    </td>
    <td><selectable>{{ details }}</selectable></td>
  </tr>
</template>

<script>
import ActorLink from '../actor-link.vue';
import DateTime from '../date-time.vue';
import Selectable from '../selectable.vue';

import Form from '../../presenters/form';
import audit from '../../mixins/audit';
import routes from '../../mixins/routes';

const typeByCategory = {
  user: 'resource.user',
  project: 'resource.project',
  form: 'resource.form',
  public_link: 'resource.publicLink',
  field_key: 'resource.appUser',
  config: 'resource.config',
  upgrade: 'audit.category.upgrade'
};

const getDisplayName = ({ displayName }) => displayName;
const acteeSpeciesByCategory = {
  user: {
    title: getDisplayName,
    path: ({ id }, vm) => vm.userPath(id)
  },
  project: {
    title: ({ name }) => name,
    path: ({ id }, vm) => vm.projectPath(id)
  },
  form: {
    title: (form) => new Form(form).nameOrId(),
    path: (form, vm) => vm.primaryFormPath(form)
  },
  public_link: {
    title: getDisplayName
  },
  field_key: {
    title: getDisplayName
  }
};
// Presumably at some point, the actee of an upgrade audit might not be a form,
// at which point we will have to update this component (perhaps we would use
// the full action or a prefix instead of the category).
acteeSpeciesByCategory.upgrade = acteeSpeciesByCategory.form;

export default {
  name: 'AuditRow',
  components: { ActorLink, DateTime, Selectable },
  mixins: [audit(), routes()],
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
      const actionMessage = this.actionMessage(this.audit.action);
      if (actionMessage == null) return [this.audit.action];
      return this.category != null
        ? [this.$t(typeByCategory[this.category]), actionMessage]
        : [actionMessage];
    },
    target() {
      if (this.category == null) return null;
      const species = acteeSpeciesByCategory[this.category];
      if (species == null) return null;
      const { actee } = this.audit;
      if (actee == null) return null;
      const result = { title: species.title(actee) };
      if (species.path != null) result.path = species.path(actee, this);
      return result;
    },
    details() {
      return this.audit.details != null
        ? JSON.stringify(this.audit.details)
        : '';
    }
  }
};
</script>

<style lang="scss">
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
}
</style>
