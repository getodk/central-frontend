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
    <h2 class="title">
      <router-link :to="projectPath(project.id)">{{ project.name }}</router-link>
    </h2>
    <table v-if="visibleForms != null" class="project-form-table table">
      <project-form-row v-for="form of visibleForms" :key="form.xmlFormId" :form="form" :columns="columns"/>
    </table>
    <div v-if="numInvisibleForms > 0" class="show-more-forms">
      Show {{ project.formList.length }} total<span class="icon-angle-down"></span>
    </div>
  </div>
</template>

<script>
import Project from '../../presenters/project';
import Form from '../../presenters/form';
import routes from '../../mixins/routes';

import ProjectFormRow from './form-row.vue';

export default {
  name: 'ProjectHomeBlock',
  components: { ProjectFormRow },
  mixins: [routes()],
  props: {
    project: {
      type: Project,
      required: true
    },
    maxForms: {
      type: Number,
      default: 3
    }
    // todo: default # of proj to show
  },
  computed: {
    visibleForms() {
      return this.project.formList.slice(0, this.maxForms).map((f) => new Form(f));
    },
    numInvisibleForms() {
      return this.project.formList.length - this.visibleForms.length;
    },
    columns() {
      // TODO don't have per-project permissions at this point
      return new Set(['name', 'idAndVersion', 'actions', 'submissions']);
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/mixins';

.project-home-block {
  .title {
    color: $color-action-foreground;
    font-size: 24px;
    margin-bottom: 5px;
  }

  padding-right: 12px;

  table {
    margin-left: 12px;
    margin-bottom: 4px;
  }

  .show-more-forms {
    margin-left: 12px;
    font-size: 14px;
    color: #888;
  }

  .icon-angle-down {
    margin-left: 5px;
  }

  .project-form-table tr:nth-child(even) {background: #eee;}
}
</style>
