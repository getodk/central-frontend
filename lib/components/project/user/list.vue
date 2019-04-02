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

<!-- Although Backend supports more complex use cases, we assume in this
component that each that each user is assigned only one role and that further,
each user either is a Project Manager or has no role. -->
<template>
  <div id="project-user-list">
    <p id="project-user-list-heading">
      The assigned Project Managers for this Project will be able to perform any
      administrative or auditing task related to this Project. Sitewide
      Administrators are automatically considered Managers of every Project. To
      learn more about Projects and Managers, please see
      <doc-link to="central-projects/#project-managers">this article</doc-link>.
    </p>
    <form id="project-user-list-search-form" @submit.prevent>
      <!-- When search is disabled, we hide rather than disable this button,
      because Bootstrap does not have CSS for .close[disabled]. -->
      <button v-show="q != '' && !searchDisabled" type="button" class="close"
        aria-label="Clear search" @click="clearSearch">
        <span aria-hidden="true">&times;</span>
      </button>
      <label class="form-group">
        <input ref="input" :value="q" :disabled="searchDisabled"
          class="form-control" placeholder="Search for a user…"
          @change="search">
        <span class="form-label">Search for a user…</span>
      </label>
    </form>
    <table class="table">
      <thead>
        <tr>
          <th>User</th>
          <th>Project Role</th>
        </tr>
      </thead>
      <tbody v-if="tableAssignments != null">
        <project-user-row v-for="assignment of tableAssignments"
          :key="assignment.actor.id" :project-id="projectId"
          :assignment="assignment" @increment-count="incrementCount"
          @decrement-count="decrementCount" @success="afterAssign"/>
      </tbody>
    </table>
    <loading :state="$store.getters.initiallyLoading(['managers', 'users'])"/>
    <p v-if="emptyMessageShown" class="empty-table-message">
      There are no Project Managers assigned to this Project yet. To add one,
      search for a user above.
    </p>
  </div>
</template>

<script>
import ProjectUserRow from './row.vue';
import { noop } from '../../../util/util';

export default {
  name: 'ProjectUserList',
  components: { ProjectUserRow },
  props: {
    projectId: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      // Assignments for the users that were returned by
      // /projects/:projectId/assignments/manager. Note that we use a different
      // schema for these objects compared to a Backend Assignment object.
      managerAssignments: null,
      // User search term
      q: '',
      // Assignments for the users that were returned for the most recent
      // search
      searchAssignments: null,
      // The number of POST or DELETE requests in progress
      assignRequestCount: 0,
      // Indicates whether this.managerAssignments needs to be refreshed once
      // the current search is cleared.
      refreshAssignments: false
    };
  },
  computed: {
    /*
    We disable search while a request for project managers is in progress,
    because we match up search results with the project managers.

    Further, we disable search while a POST or DELETE request is in progress. If
    the user were able to clear the search while a POST or DELETE was in
    progress, it could trigger a refresh of the project managers. In that case,
    once the POST/DELETE was successful, we would have to find the element of
    this.managerAssignments to update -- and it might even be unclear whether we
    should update that element.
    */
    searchDisabled() {
      return this.$store.getters.loading('managers') ||
        this.assignRequestCount !== 0;
    },
    // The assignments to show in the table
    tableAssignments() {
      if (this.$store.getters.loading('users')) return null;
      if (this.searchAssignments != null) return this.searchAssignments;
      return this.managerAssignments;
    },
    emptyMessageShown() {
      return this.searchAssignments == null &&
        this.managerAssignments != null && this.managerAssignments.length === 0;
    }
  },
  watch: {
    projectId() {
      this.fetchData();
      this.q = '';
      this.searchAssignments = null;
      this.assignRequestCount = 0;
      this.refreshAssignments = false;
    }
  },
  created() {
    this.fetchData();
  },
  methods: {
    fetchData() {
      this.managerAssignments = null;
      this.$store.dispatch('get', [{
        key: 'managers',
        url: `/projects/${this.projectId}/assignments/manager`,
        success: ({ managers }) => {
          this.managerAssignments = managers
            .map(actor => ({ actor, manager: true, searchOnly: false }));
        }
      }]).catch(noop);
    },
    clearSearch() {
      if (this.refreshAssignments) {
        this.fetchData();
        this.refreshAssignments = false;
      }
      this.q = '';
      this.searchAssignments = null;
    },
    search() {
      // Using this.$refs rather than passing $event.target.value to the method
      // in order to facilitate testing.
      this.q = this.$refs.input.value;
      if (this.q === '') {
        this.clearSearch();
        return;
      }

      this.$store.dispatch('get', [{
        key: 'users',
        url: `/users?q=${encodeURIComponent(this.q)}`,
        success: ({ users }) => {
          this.searchAssignments = users.map(user => {
            const assignment = this.managerAssignments
              .find(a => a.actor.id === user.id);
            if (assignment != null) return assignment;
            return { actor: user, manager: false, searchOnly: true };
          });
        }
      }]).catch(noop);
    },
    incrementCount() {
      this.assignRequestCount += 1;
    },
    decrementCount() {
      this.assignRequestCount -= 1;
    },
    // Run after a user is assigned a new role (including None).
    afterAssign(assignment, manager) {
      this.$set(assignment, 'manager', manager);
      if (assignment.searchOnly) this.refreshAssignments = true;
      const { displayName } = assignment.actor;
      const roleName = manager ? 'Manager' : 'None';
      this.$alert().success(`Success! ${displayName} has been given a Project Role of “${roleName}” on this Project.`);
    }
  }
};
</script>

<style lang="scss">
@import '../../../../assets/scss/variables';

#project-user-list {
  // Fixing column widths so that they do not change during search.
  th, td {
    width: 50%;
  }
}

#project-user-list-heading {
  margin-bottom: 20px;
}

#project-user-list-search-form {
  position: relative;
  width: 275px;

  .form-control {
    // Add padding so that .close does not overlay long input text.
    padding-right: 21px;
    width: 250px;
  }

  .close {
    // Similar to .alert-dismissable .close.
    position: relative;
    right: 30px;
    top: 4px;
    // 1 greater than the z-index for .form-control
    z-index: 2;

    opacity: 0.5;

    &:hover, &:focus {
      opacity: 0.2;
    }
  }
}
</style>
