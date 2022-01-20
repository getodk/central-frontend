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

import audit from '../../mixins/audit';
import routes from '../../mixins/routes';

const categories = {
  user: {
    type: 'resource.user',
    target: (actee, vm) => ({
      title: actee.displayName,
      path: vm.userPath(actee.id)
    })
  },
  project: {
    type: 'resource.project',
    target: (actee, vm) => ({
      title: actee.name,
      path: vm.projectPath(actee.id)
    })
  },
  form: {
    type: 'resource.form',
    target: (actee, vm) => {
      const { Form } = vm.container;
      return { title: new Form(actee), path: vm.primaryFormPath(actee) };
    }
  },
  public_link: {
    type: 'resource.publicLink',
    target: (actee) => ({ title: actee.displayName })
  },
  field_key: {
    type: 'resource.appUser',
    target: (actee) => ({ title: actee.displayName })
  },
  config: {
    type: 'resource.config'
  },
  upgrade: {
    type: 'audit.category.upgrade'
  }
};
// Presumably at some point, the actee of an upgrade audit might not be a form,
// at which point we will have to update this component (perhaps we would use
// the full action or a prefix instead of the category).
categories.upgrade.target = categories.form.target;

export default {
  name: 'AuditRow',
  components: { ActorLink, DateTime, Selectable },
  mixins: [audit(), routes()],
  inject: ['container'],
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
        ? [this.$t(categories[this.category].type), actionMessage]
        : [actionMessage];
    },
    target() {
      if (this.category == null) return null;
      const createTarget = categories[this.category].target;
      return createTarget != null ? createTarget(this.audit.actee, this) : null;
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
