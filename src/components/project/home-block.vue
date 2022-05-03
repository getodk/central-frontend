<!--
Copyright 2022 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div class="project-home-block">
    <div class="title">
      <router-link :to="projectPath(project.id)">{{ project.name }}</router-link>
      <span v-if="project.keyId" class="encrypted badge"
        :title="$t('encryptionTip')">
        <span class="icon-lock project-icon"></span>
        {{ $t('encrypted') }}
        </span>
    </div>
    <table v-if="visibleForms != null" class="project-form-table table">
      <project-form-row v-for="form of visibleForms" :key="form.xmlFormId" :form="form"/>
    </table>
    <div v-if="showExpander">
      <span class="expand-button" @click.prevent="toggleExpanded">
        <template v-if="!expanded">
          {{ $tcn('showMore', numForms) }}<span class="icon-angle-down"></span>
        </template>
        <template v-else>
          {{ $tcn('showFewer', numForms) }}<span class="icon-angle-up"></span>
        </template>
      </span>
    </div>
  </div>
</template>

<script>
import routes from '../../mixins/routes';

import ProjectFormRow from './form-row.vue';

export default {
  name: 'ProjectHomeBlock',
  components: { ProjectFormRow },
  mixins: [routes()],
  props: {
    project: {
      type: Object,
      required: true
    },
    sortFunc: {
      type: Function,
      required: true
    },
    maxForms: {
      type: Number,
      default: 3
    }
  },
  data() {
    return {
      expanded: false
    };
  },
  computed: {
    visibleForms() {
      const sortedForms = [...this.project.formList];
      sortedForms.sort(this.sortFunc);
      return this.expanded
        ? sortedForms
        : sortedForms.slice(0, this.maxForms);
    },
    showExpander() {
      return this.numForms > this.maxForms;
    },
    numForms() {
      return this.project.formList.length;
    }
  },
  methods: {
    toggleExpanded() {
      this.expanded = !this.expanded;
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/mixins';

.project-home-block {
  margin-bottom: 15px;

  .title {
    color: $color-action-foreground;
    font-size: 24px;
    font-weight: 500;
    margin-bottom: 5px;
  }

  .encrypted {
    margin-left: 9px;
    color: #333;
    background-color: #ccc;
    font-weight: 400;
  }

  padding-right: 12px;

  table {
    margin-left: 9px;
    margin-bottom: 4px;
  }

  .expand-button {
    margin-left: 15px;
    font-size: 14px;
    color: #888;
    cursor: pointer;
  }

  .icon-angle-down, .icon-angle-up {
    margin-left: 5px;
  }

  .project-form-table tr:nth-child(3n + 2) {background: #eee;}
}
</style>


<i18n lang="json5">
{
  "en": {
    "encrypted": "Encrypted",
    "encryptionTip": "This Project uses managed encryption.",
    "showMore": "Show {count} total",
    "showFewer": "Show fewer of {count} total"
  }
}
</i18n>
