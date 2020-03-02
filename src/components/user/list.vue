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
component that each user is assigned only one role and that further, each user
either is an Administrator or has no role. -->
<template>
  <div>
    <div class="heading-with-button">
      <button id="user-list-new-button" type="button" class="btn btn-primary"
        @click="showModal('newUser')">
        <span class="icon-plus-circle"></span>Create Web User&hellip;
      </button>
      <p>
        Web Users have accounts on this website to oversee and administer the
        Projects on this server. Administrators can manage anything on the site.
        Users with no role can still be made Project Managers on any Project,
        from that Project&rsquo;s settings.
      </p>
      <p>
        For more information,
        <doc-link to="central-users/#managing-app-users">click here</doc-link>.
      </p>
    </div>
    <div class="table-actions">
      <refresh-button :configs="configsForRefresh"/>
    </div>
    <table id="user-list-table" class="table">
      <thead>
        <tr>
          <th>Display Name</th>
          <th>Email Address</th>
          <th>Sitewide Role</th>
          <th class="user-actions">Actions</th>
        </tr>
      </thead>
      <tbody v-if="users != null && adminIds != null">
        <user-row v-for="user of users" :key="user.id" :user="user"
          :admin="adminIds.has(user.id)" :highlighted="highlighted"
          @assigned-role="afterAssignRole" @reset-password="showResetPassword"
          @retire="showRetire"/>
      </tbody>
    </table>
    <loading :state="$store.getters.initiallyLoading(['users', 'actors'])"/>

    <user-new v-bind="newUser" @hide="hideModal('newUser')"
      @success="afterCreate"/>
    <user-reset-password v-bind="resetPassword"
      @hide="hideModal('resetPassword')" @success="afterResetPassword"/>
    <user-retire v-bind="retire" @hide="hideModal('retire')"
      @success="afterRetire"/>
  </div>
</template>

<script>
import DocLink from '../doc-link.vue';
import Loading from '../loading.vue';
import RefreshButton from '../refresh-button.vue';
import UserNew from './new.vue';
import UserResetPassword from './reset-password.vue';
import UserRetire from './retire.vue';
import UserRow from './row.vue';
import modal from '../../mixins/modal';
import validateData from '../../mixins/validate-data';
import { noop } from '../../util/util';
import { requestData } from '../../store/modules/request';

export default {
  name: 'UserList',
  components: {
    DocLink,
    Loading,
    RefreshButton,
    UserNew,
    UserResetPassword,
    UserRetire,
    UserRow
  },
  mixins: [modal(), validateData({ update: false })],
  data() {
    return {
      // The ids of the users who are administrators
      adminIds: null,
      // The id of the highlighted user
      highlighted: null,
      // Modals
      newUser: {
        state: false
      },
      resetPassword: {
        state: false,
        user: null
      },
      retire: {
        state: false,
        user: null
      }
    };
  },
  computed: {
    ...requestData(['users']),
    configsForRefresh() {
      return this.configsForGet(true);
    }
  },
  created() {
    this.$store.dispatch('get', this.configsForGet(false)).catch(noop);
  },
  methods: {
    configsForGet(resetHighlighted) {
      return [
        {
          key: 'users',
          url: '/users',
          success: () => {
            if (resetHighlighted) {
              // eslint-disable-next-line vue/no-side-effects-in-computed-properties
              this.highlighted = null;
            }
          }
        },
        {
          key: 'actors',
          url: '/assignments/admin',
          success: ({ actors }) => {
            // eslint-disable-next-line vue/no-side-effects-in-computed-properties
            this.adminIds = new Set();
            for (const actor of actors)
              this.adminIds.add(actor.id);
          }
        }
      ];
    },
    afterCreate(user) {
      this.adminIds = null;
      this.$store.dispatch('get', this.configsForGet(false)).catch(noop);
      this.hideModal('newUser');
      this.$alert().success(`A user was created successfully for "${user.displayName}".`);
      this.highlighted = user.id;
    },
    // Called after a user is assigned a new role (including None).
    afterAssignRole(user, admin) {
      const roleName = admin ? 'Administrator' : 'None';
      this.$alert().success(`Success! "${user.displayName}" has been given a Sitewide Role of "${roleName}".`);

      /*
      Here we update this.adminIds. If the current user has also refreshed the
      data, then in rare cases, the update to this.adminIds will not be shown.
      For example:

        1. The current user changes another user's sitewide role.
        2. Immediately after, the user clicks the refresh button.
        3. The response for the role change is received first, updating
           this.adminIds.
        4. The response for the refresh is received, possibly undoing the
           update to this.adminIds.

      In cases like this, the current user will likely refresh Frontend or redo
      the change.
      */
      if (this.adminIds != null) {
        if (admin) {
          this.adminIds.add(user.id);
        } else {
          this.adminIds.delete(user.id);
        }
      }
    },
    showResetPassword(user) {
      this.resetPassword.user = user;
      this.resetPassword.state = true;
    },
    afterResetPassword(user) {
      this.resetPassword.state = false;
      this.$alert().success(`The password for "${user.displayName}" has been invalidated. An email has been sent to ${user.email} with instructions on how to proceed.`);
    },
    showRetire(user) {
      this.retire.user = user;
      this.retire.state = true;
    },
    afterRetire(user) {
      this.$store.dispatch('get', this.configsForGet(true)).catch(noop);
      this.retire.state = false;
      this.$alert().success(`The user "${user.displayName}" has been retired.`);
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#user-list-table {
  table-layout: fixed;

  th, td {
    &.user-actions {
      // 160px is the width of the .dropdown-menu.
      width: $padding-left-table-data + $padding-right-table-data + 160px;
    }
  }
}
</style>
