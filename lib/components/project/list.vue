<!--
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/opendatakit/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div>
    <page-section>
      <template slot="heading">
        <span>Projects</span>
        <button id="project-list-new-button" type="button"
          class="btn btn-primary" @click="showModal('newProject')">
          <span class="icon-plus-circle"></span>Create a new Project
        </button>
      </template>
      <template slot="body">
        <loading :state="maybeProjects.awaiting"/>
        <template v-if="maybeProjects.success">
          <p v-if="maybeProjects.data.length === 0"
            id="project-list-empty-message">
            To get started, add a Project.
          </p>
          <table v-else id="project-list-table" class="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Forms</th>
                <th>Latest Submission</th>
              </tr>
            </thead>
            <tbody>
              <project-row v-for="project of maybeProjects.data" :key="project.id"
                :project="project"/>
            </tbody>
          </table>
        </template>
      </template>
    </page-section>
    <project-new v-bind="newProject" @hide="hideModal('newProject')"
      @success="afterCreate"/>
  </div>
</template>

<script>
import ProjectNew from './new.vue';
import ProjectRow from './row.vue';
import modal from '../../mixins/modal';
import request from '../../mixins/request';

export default {
  name: 'ProjectList',
  components: { ProjectNew, ProjectRow },
  mixins: [modal(['newProject']), request()],
  data() {
    return {
      requestId: null,
      maybeProjects: null,
      newProject: {
        state: false
      }
    };
  },
  created() {
    this.maybeGet({
      maybeProjects: {
        url: '/projects',
        extended: true
      }
    });
  },
  methods: {
    afterCreate(project) {
      this.$router.push(`/projects/${project.id}`, () => {
        this.$alert().success('Your new Project has been successfully created.');
      });
    }
  }
};
</script>

<style lang="sass">
@import '../../../assets/scss/variables';

#project-list-table {
  tbody td {
    vertical-align: middle;

    &.project-list-project-name a {
      color: inherit;
      font-size: 24px;
      text-decoration: initial;

      .icon-angle-right {
        color: $color-accent-primary;
        font-size: 20px;
        margin-left: 2px;
        margin-right: 0;
      }
    }
  }
}
</style>
