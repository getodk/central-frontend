<!--
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

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
      Project Viewers can access and download all Form data in this Project, but
      cannot make any changes to settings or data. To learn more about Projects,
      Managers and Viewers, please see
      <doc-link to="central-projects/#project-managers">this article</doc-link>.
    </p>

    <form id="project-user-list-search-form" @submit.prevent>
      <!-- When search is disabled, we hide rather than disable this button,
      because Bootstrap does not have CSS for .close[disabled]. -->
      <button v-show="q != '' && !searchDisabled" type="button" class="close"
        aria-label="Clear search" @click="clearSearch">
        <span aria-hidden="true">&times;</span>
      </button>
      <form-group :value="q" :placeholder="searchLabel"
        :disabled="searchDisabled" autocomplete="off" @change="changeQ"/>
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
import DocLink from '../../doc-link.vue';
import FormGroup from '../../form-group.vue';
import Loading from '../../loading.vue';
import ProjectUserRow from './row.vue';
import validateData from '../../../mixins/validate-data';
import { apiPaths } from '../../../util/request';
import { noop } from '../../../util/util';
import { requestData } from '../../../store/modules/request';

export default {
  name: 'ProjectUserList',
  components: { DocLink, FormGroup, Loading, ProjectUserRow },
  mixins: [validateData()],
  props: {
    projectId: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      // Search term
      q: '',
      // searchAssignments is an array that contains an assignment-like object
      // for each user returned for the most recent search. roleId may be `null`
      // for one or more of these objects. searchAssignments is not updated
      // after an assignment change: it is a snapshot of assignments at the time
      // of the search.
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
    searchDisabled() {
      if (!this.dataExists) return true;
      /*
      We disable search while a POST or DELETE request is in progress. If the
      user cleared the search while a POST or DELETE was in progress, a new
      request for the project assignments would be sent. In that case, once the
      POST/DELETE was successful, we would have to find the element of
      this.projectAssignments to update -- and it might even be unclear whether
      we should update that element.
      */
      return this.assignRequestCount !== 0;
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
          url: apiPaths.projectAssignments(this.projectId),
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
        url: apiPaths.users({ q: this.q }),
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
    /*
    afterAssignmentChange() completes two tasks after an assignment change:

      1. Shows an alert about the change.
      2. Updates this.projectAssignments to reflect the change.
        - Note that this.searchAssignments is not similarly updated.
    */
    afterAssignmentChange(actor, role, deleteWithoutPost) {
      // Update this.projectAssignments.
      const index = this.projectAssignments
        .findIndex(assignment => assignment.actor.id === actor.id);
      // If `role` is `null`, then rather than remove the assignment from
      // projectAssignments, we set its roleId to `null`. That way, the user
      // will remain in the table until a new request is sent for
      // projectAssignments.
      const assignment = { actor, roleId: role != null ? role.id : null };
      if (index !== -1) {
        this.$store.commit('setDataProp', {
          key: 'projectAssignments',
          prop: index,
          value: assignment
        });
      } else {
        this.$store.commit('setData', {
          key: 'projectAssignments',
          value: [...this.projectAssignments, assignment]
        });
      }

      // Show the alert.
      if (deleteWithoutPost) {
        this.$alert().danger(this.$t('alert.unassignWithoutReassign', actor));
      } else if (role != null) {
        this.$alert().success(this.$t('alert.assignRole', {
          displayName: actor.displayName,
          roleName: role.name
        }));
      } else {
        this.$alert().success(this.$t('alert.unassignRole', actor));
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
