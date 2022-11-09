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
        <span v-if="audit.actor.deletedAt != null" class="icon-trash" :title="$t('deletedMessage')"></span>
        <actor-link :actor="audit.actor"/>
      </template>
    </td>
    <td class="target">
      <template v-if="target != null">
        <router-link v-if="target.path != null" :to="target.path"
          :title="target.title">
          {{ target.title }}
        </router-link>
        <template v-else>
          <span v-if="target.deleted" class="icon-trash" :title="$t('deletedMessage')"></span>
          <span v-else-if="target.purged" class="icon-trash" :title="$t('purgedMessage')"></span>
          <span :title="target.title">{{ target.title }}</span>
        </template>
      </template>
    </td>
    <td><selectable>{{ details }}</selectable></td>
  </tr>
</template>

<script>
import ActorLink from '../actor-link.vue';
import DateTime from '../date-time.vue';
import Selectable from '../selectable.vue';

import routes from '../../mixins/routes';
import useAudit from '../../composables/audit';

const typeByCategory = {
  user: 'resource.user',
  project: 'resource.project',
  form: 'resource.form',
  dataset: 'resource.dataset',
  public_link: 'resource.publicLink',
  field_key: 'resource.appUser',
  config: 'resource.config',
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
    path: (actee, { primaryFormPath }) => primaryFormPath(actee)
  },
  dataset: {
    title: (actee) => actee.name
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
  mixins: [routes()],
  props: {
    audit: {
      type: Object,
      required: true
    }
  },
  setup() {
    const { actionMessage } = useAudit();
    return { actionMessage };
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

      // purged actee (used purgedName as title)
      if (actee.purgedAt != null)
        return { title: actee.purgedName, purged: true };

      const title = species.title(actee);
      // soft-deleted actee (use species title but don't make a link)
      if (actee.deletedAt != null) return { title, deleted: true };

      const result = { title };
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

  .icon-trash {
    cursor: help;
    margin-right: $margin-right-icon;
  }
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
  "sw": {
    "deletedMessage": "Rasimali hii imefutwa",
    "purgedMessage": "Rasilimali hii imesafishwa."
  }
}
</i18n>
