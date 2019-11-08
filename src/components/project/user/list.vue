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
component that each user is assigned at most one role and that the only roles
are Project Manager and Project Viewer. -->
<template>
  <div id="project-user-list">
    <p id="project-user-list-heading">
      The assigned Project Managers for this Project will be able to perform any
      administrative or auditing task related to this Project. Sitewide
      Administrators are automatically considered Managers of every Project.
      Project Viewers can access and download all form data in this Project, but
      cannot make any changes to settings or data. To learn more about Project,
      Managers, and Viewers, please see
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
        <input class="form-control" :value="q" :placeholder="searchLabel"
          :disabled="searchDisabled" @change="changeQ($event.target.value)">
        <span class="form-label">{{ searchLabel }}</span>
      </label>
    </form>

    <table class="table">
      <thead>
        <tr>
          <th>User</th>
          <th>Project Role</th>
        </tr>
      </thead>
      <tbody v-if="roles != null && tableAssignments != null">
        <project-user-row v-for="assignment of tableAssignments"
          :key="assignment.actor.id" :assignment="assignment"
          @increment-count="incrementCount" @decrement-count="decrementCount"
          @change="afterAssignmentChange"/>
      </tbody>
    </table>
    <loading :state="initiallyLoading || $store.getters.loading('users')"/>
    <p v-show="emptyMessage !== ''" class="empty-table-message">
      {{ emptyMessage }}
    </p>
  </div>
</template>

<script>
import ProjectUserRow from './row.vue';
import validateData from '../../../mixins/validate-data';
import { noop } from '../../../util/util';
import { requestData } from '../../../store/modules/request';

export default {
  name: 'ProjectUserList',
  components: { ProjectUserRow },
  mixins: [validateData()],
  props: {
    projectId: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      // User search term
      q: '',
      // An array of assignment-like objects for the users that were returned
      // for the most recent search. roleId may be `null` for one or more of
      // these objects.
      searchAssignments: null,
      // The number of POST or DELETE requests in progress
      assignRequestCount: 0
    };
  },
  computed: {
    ...requestData(['currentUser', 'roles', 'projectAssignments']),
    initiallyLoading() {
      return this.$store.getters.initiallyLoading(['roles', 'projectAssignments']);
    },
    dataExists() {
      return this.$store.getters.dataExists(['roles', 'projectAssignments']);
    },
    /*
    We disable search while a request for the assignments is in progress,
    because we match up search results to the existing assignments.

    Further, we disable search while a POST or DELETE request is in progress. If
    the user cleared the search while a POST or DELETE was in progress, a new
    request for the project assignments would be sent. In that case, once the
    POST/DELETE was successful, we would have to find the element of
    this.projectAssignments to update -- and it might even be unclear whether we
    should update that element.
    */
    searchDisabled() {
      return !this.dataExists || this.assignRequestCount !== 0;
    },
    searchLabel() {
      return this.currentUser.can('user.list')
        ? 'Search for a user…'
        : 'Enter exact user email address…';
    },
    // The assignments to show in the table
    tableAssignments() {
      if (this.$store.getters.loading('users')) return null;
      if (this.searchAssignments != null) return this.searchAssignments;
      return this.projectAssignments;
    },
    emptyMessage() {
      if (!this.dataExists || this.$store.getters.loading('users')) return '';
      if (this.searchAssignments != null)
        return this.searchAssignments.length === 0 ? 'No results' : '';
      return this.projectAssignments.length === 0
        ? 'There are no users assigned to this Project yet. To add one, search for a user above.'
        : '';
    }
  },
  watch: {
    projectId() {
      this.fetchData(true);
      this.q = '';
      this.searchAssignments = null;
      this.assignRequestCount = 0;
    }
  },
  created() {
    this.fetchData(false);
  },
  methods: {
    fetchData(resend) {
      this.$store.dispatch('get', [
        {
          key: 'roles',
          url: '/roles',
          resend: false
        },
        {
          key: 'projectAssignments',
          url: `/projects/${this.projectId}/assignments`,
          extended: true,
          resend
        }
      ]).catch(noop);
    },
    clearSearch() {
      this.fetchData(true);
      this.q = '';
      this.searchAssignments = null;
    },
    search() {
      this.$store.dispatch('get', [{
        key: 'users',
        url: `/users?q=${encodeURIComponent(this.q)}`,
        success: ({ users }) => {
          this.searchAssignments = users.map(user => {
            const assignment = this.projectAssignments
              .find(a => a.actor.id === user.id);
            return assignment != null
              ? assignment
              : { actor: user, roleId: null };
          });
        }
      }]).catch(noop);
    },
    changeQ(q) {
      this.q = q;
      if (this.q === '')
        this.clearSearch();
      else
        this.search();
    },
    incrementCount() {
      this.assignRequestCount += 1;
    },
    decrementCount() {
      this.assignRequestCount -= 1;
    },
    afterAssignmentChange(assignment, role, deleteWithoutPost) {
      // If `role` is `null`, then we set the assignment's roleId to `null`
      // rather than remove the assignment from projectAssignments. That way,
      // the user will remain in the table until projectAssignments is
      // refreshed.
      this.$store.commit('setDataProp', {
        key: 'projectAssignments',
        prop: this.projectAssignments.findIndex(a => a === assignment),
        value: { ...assignment, roleId: role != null ? role.id : null }
      });

      const { displayName } = assignment.actor;
      if (deleteWithoutPost) {
        this.$alert().danger(`Something went wrong. "${displayName}" has been removed from the Project.`);
      } else {
        this.$alert().success(role != null
          ? `Success! "${displayName}" has been given a Role of "${role.name}" on this Project.`
          : `Success! "${displayName}" has been removed from this Project.`);
      }
    }
  }
};
</script>

<style lang="scss">
@import '../../../assets/scss/variables';

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

#project-user-list table {
  table-layout: fixed;
}
</style>
