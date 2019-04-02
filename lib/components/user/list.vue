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
    <div class="heading-with-button">
      <button id="user-list-new-button" type="button" class="btn btn-primary"
        @click="showModal('newUser')">
        <span class="icon-plus-circle"></span>Create Web User
      </button>
      <p>
        Web Users have accounts on this website to oversee and administer the
        Projects on this server. Administrators can manage anything on the site.
        Users with no role can still be made Project Managers on any Project,
        from that Project's settings.
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
          <th>Email Address</th>
          <th>Is Administrator?</th>
          <th class="user-actions">Actions</th>
        </tr>
      </thead>
      <tbody v-if="users != null && adminIds != null && users.length !== 0">
        <user-row v-for="user of users" :key="user.id" :user="user"
          :highlighted="highlighted" @reset-password="showResetPassword"/>
      </tbody>
    </table>
    <loading :state="$store.getters.initiallyLoading(['users', 'assignmentActors'])"/>

    <user-new v-bind="newUser" @hide="hideModal('newUser')"
      @success="afterCreate"/>
    <user-reset-password v-bind="resetPassword"
      @hide="hideModal('resetPassword')" @success="afterResetPassword"/>
  </div>
</template>

<script>
import UserNew from './new.vue';
import UserResetPassword from './reset-password.vue';
import UserRow from './row.vue';
import modal from '../../mixins/modal';
import { noop } from '../../util/util';
import { requestData } from '../../store/modules/request';

export default {
  name: 'UserList',
  components: { UserNew, UserResetPassword, UserRow },
  mixins: [modal(['newUser', 'resetPassword'])],
  data() {
    return {
      highlighted: null,
      newUser: {
        state: false
      },
      resetPassword: {
        state: false,
        user: {
          email: ''
        }
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
          key: 'assignmentActors',
          url: '/assignments/admin',
          success: ({ assignmentActors }) => {
            // eslint-disable-next-line vue/no-side-effects-in-computed-properties
            this.adminIds = new Set();
            for (const actor of assignmentActors)
              this.adminIds.add(actor.id);
          }
        }
      ];
    },
    showResetPassword(user) {
      this.resetPassword.user = user;
      this.resetPassword.state = true;
    },
    afterCreate(user) {
      this.$store.dispatch('get', this.configsForGet(false)).catch(noop);
      this.hideModal('newUser');
      this.$alert().success(`A user was created successfully for ${user.email}.`);
      this.highlighted = user.id;
    },
    afterResetPassword() {
      const { email } = this.resetPassword.user;
      this.$alert().success(`The password for ${email} has been invalidated. An email has been sent to ${email} with instructions on how to proceed.`);
    }
  }
};
</script>

<style lang="sass">
@import '../../../assets/scss/variables';

// 160px is the width of the .dropdown-menu.
$actions-width: $padding-left-table-data + $padding-right-table-data + 160px;

#user-list-table {
  table-layout: fixed;

  th, td {
    width: calc(50% - #{$actions-width / 2});

    &.user-actions {
      width: $actions-width;
    }
  }

  td {
    vertical-align: middle;
  }
}
</style>
