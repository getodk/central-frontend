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
      <template v-if="audit.actor != null">
        <span v-if="audit.actor.deletedAt != null" class="icon-trash" v-tooltip.sr-only></span>
        <actor-link :actor="audit.actor"/>
        <span v-if="audit.actor.deletedAt != null" class="sr-only">
          &nbsp;{{ $t('deletedMessage') }}
        </span>
      </template>
    </td>
    <td class="target">
      <template v-if="target != null">
        <component v-if="target.component != null" :is="target.component"
          v-bind="target.props" v-tooltip.text/>
        <router-link v-else-if="target.path != null" :to="target.path"
          v-tooltip.text>
          {{ target.title }}
        </router-link>
        <template v-else>
          <span v-if="target.deleted || target.purged" class="icon-trash" v-tooltip.sr-only></span>
          <span v-tooltip.text>{{ target.title }}</span>
          <span v-if="target.deleted || target.purged" class="sr-only">
            &nbsp;{{ target.deleted ? $t('deletedMessage') : $t('purgedMessage') }}
          </span>
        </template>
      </template>
    </td>
    <td><selectable>{{ details }}</selectable></td>
  </tr>
</template>

<script>
import { pick } from 'ramda';

import ActorLink from '../actor-link.vue';
import DatasetLink from '../dataset/link.vue';
import FormLink from '../form/link.vue';
import DateTime from '../date-time.vue';
import Selectable from '../selectable.vue';

import useAudit from '../../composables/audit';
import useRoutes from '../../composables/routes';

// If the Type column for an audit log entry has two parts, typeByFirstPart
// indicates the i18n path to use for the first part. typeByFirstPart is keyed
// by the first part/segment of the audit log action.
const typeByFirstPart = {
  // Resources for which filtering is available
  user: 'resource.user',
  project: 'resource.project',
  form: 'resource.form',
  field_key: 'resource.appUser',
  public_link: 'resource.publicLink',
  dataset: 'resource.entityList',
  config: 'resource.config',
  entity: 'resource.entityList',

  // System Operation
  analytics: 'audit.category.task',
  blobs: 'audit.category.task',
  submission: 'audit.category.task',

  // Server Upgrade
  upgrade: 'audit.category.upgrade'
};

const getDisplayName = (actee) => actee.displayName;
const acteeSpeciesByCategory = {
  user: {
    title: getDisplayName,
    path: (actee, { userPath }) => userPath(actee.id)
  },
  project: {
    title: (actee) => actee.name,
    path: (actee, { projectPath }) => projectPath(actee.id)
  },
  form: {
    title: (actee) => (actee.name != null ? actee.name : actee.xmlFormId),
    component: FormLink,
    props: (actee) => ({ form: actee })
  },
  dataset: {
    title: (actee) => actee.name,
    component: DatasetLink,
    props: pick(['projectId', 'name'])
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

// Actee of Entity Bulk Delete and Restore is dataset
acteeSpeciesByCategory.entity = acteeSpeciesByCategory.dataset;

export default {
  name: 'AuditRow',
  components: { ActorLink, DatasetLink, DateTime, FormLink, Selectable },
  props: {
    audit: {
      type: Object,
      required: true
    }
  },
  setup() {
    const { actionMessage } = useAudit();
    const { projectPath, userPath } = useRoutes();
    return { actionMessage, projectPath, userPath };
  },
  computed: {
    // When an audit log action has multiple parts/segments, we treat it as
    // having a "category" indicated by the first part. For example, the
    // category of project.create is project.
    category() {
      const index = this.audit.action.indexOf('.');
      return index !== -1 ? this.audit.action.slice(0, index) : null;
    },
    type() {
      const { action } = this.audit;
      const actionMessage = this.actionMessage(action);
      if (actionMessage == null) return [action];
      const result = [actionMessage];

      // The first part/segment of `action`.
      const firstPart = this.category ?? action;
      const typeOfFirstPart = typeByFirstPart[firstPart];
      if (typeOfFirstPart != null) result.unshift(this.$t(typeOfFirstPart));

      return result;
    },
    target() {
      if (this.category == null) return null;
      const species = acteeSpeciesByCategory[this.category];
      if (species == null) return null;

      const { actee } = this.audit;
      if (actee == null) return null;
      const deleted = actee.deletedAt != null;
      const purged = actee.purgedAt != null;
      const result = {
        title: purged ? actee.purgedName : species.title(actee),
        deleted,
        purged
      };
      if (!(deleted || purged)) {
        if (species.path != null) {
          result.path = species.path(actee, this);
        } else if (species.component != null) {
          result.component = species.component;
          result.props = species.props(actee);
        }
      }
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
@import '../../assets/scss/mixins';

.audit-row {
  .table tbody & td {
    vertical-align: middle;
  }

  .icon-angle-right {
    font-size: 8px;
    vertical-align: 1px;
  }

  .initiator, .target { @include text-overflow-ellipsis; }
  .icon-trash { margin-right: $margin-right-icon; }
}
</style>

<i18n lang="json5">
{
  "en": {
    // This shows as a tool tip in the audit log explaining that a resource
    // has been deleted.
    "deletedMessage": "This resource has been deleted.",
    // This shows as a tool tip in the audit log explaining that a resource
    // has been purged (deleted forever).
    "purgedMessage": "This resource has been purged."
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "deletedMessage": "Tento zdroj byl smazán.",
    "purgedMessage": "Tento zdroj byl vyčištěn."
  },
  "de": {
    "deletedMessage": "Diese Ressource wurde gelöscht.",
    "purgedMessage": "Diese Ressource wurde gelöscht."
  },
  "es": {
    "deletedMessage": "Este recurso ha sido borrado.",
    "purgedMessage": "Este recurso ha sido vaciado."
  },
  "fr": {
    "deletedMessage": "Cette ressource a été supprimée.",
    "purgedMessage": "Cette ressource a été purgée."
  },
  "it": {
    "deletedMessage": "Questa risorsa è stata eliminata.",
    "purgedMessage": "Questa risorsa è stata eliminata definitivamente."
  },
  "ja": {
    "deletedMessage": "これは削除されました。",
    "purgedMessage": "これは完全に削除されました。"
  },
  "pt": {
    "deletedMessage": "Esse recurso foi deletado.",
    "purgedMessage": "Esse recurso foi limpo."
  },
  "sw": {
    "deletedMessage": "Rasimali hii imefutwa",
    "purgedMessage": "Rasilimali hii imesafishwa."
  },
  "zh": {
    "deletedMessage": "该资源已删除。",
    "purgedMessage": "该资源已清除。"
  },
  "zh-Hant": {
    "deletedMessage": "該資源已被刪除。",
    "purgedMessage": "該資源已清除。"
  }
}
</i18n>
