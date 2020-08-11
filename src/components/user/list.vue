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
component that each user is assigned only one role and that further, each user
either is an Administrator or has no role. -->
<template>
  <div>
    <div class="heading-with-button">
      <button id="user-list-new-button" type="button" class="btn btn-primary"
        @click="showModal('newUser')">
        <span class="icon-plus-circle"></span>{{ $t('action.create') }}&hellip;
      </button>
      <i18n tag="p" path="heading[0]">
        <template #collect>
          <doc-link to="collect-intro/">ODK Collect</doc-link>
        </template>
      </i18n>
    </div>
    <div class="table-actions">
      <refresh-button :configs="configsForRefresh"/>
    </div>
    <table id="user-list-table" class="table">
      <thead>
        <tr>
          <th>{{ $t('header.displayName') }}</th>
          <th>{{ $t('header.email') }}</th>
          <th>{{ $t('header.sitewideRole') }}</th>
          <th>{{ $t('header.actions') }}</th>
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
  mixins: [modal(), validateData()],
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
      this.$alert().success(this.$t('alert.create', user));
      this.highlighted = user.id;
    },
    // Called after a user is assigned a new role (including None).
    afterAssignRole(user, admin) {
      this.$alert().success(this.$t('alert.assignRole', {
        displayName: user.displayName,
        roleName: admin ? this.$t('role.admin') : this.$t('role.none')
      }));

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
      this.showModal('resetPassword');
    },
    afterResetPassword(user) {
      this.hideModal('resetPassword');
      this.$alert().success(this.$t('alert.resetPassword', user));
    },
    showRetire(user) {
      this.retire.user = user;
      this.showModal('retire');
    },
    afterRetire(user) {
      this.$store.dispatch('get', this.configsForGet(true)).catch(noop);
      this.hideModal('retire');
      this.$alert().success(this.$t('alert.retire', user));
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#user-list-table {
  table-layout: fixed;

  th:nth-child(4) {
    width: $padding-left-table-data + $padding-right-table-data +
      $min-width-dropdown-menu;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    "action": {
      "create": "Create Web User"
    },
    "heading": [
      // {collect} is a link whose text is "ODK Collect".
      "Web Users have accounts on this website to oversee and administer the Projects on this server. Administrators can manage anything on the site. Users with no Sitewide Role can be given a Role on any Project, from that Project’s settings. Sitewide Administrators and some Project Roles can use a web browser to fill out Forms. To submit data through an application such as {collect}, create App Users for each Project."
    ],
    "header": {
      "sitewideRole": "Sitewide Role"
    },
    "alert": {
      "create": "A user was created successfully for “{displayName}”.",
      "assignRole": "Success! “{displayName}” has been given a Sitewide Role of “{roleName}”.",
      "resetPassword": "The password for “{displayName}” has been invalidated. An email has been sent to {email} with instructions on how to proceed.",
      "retire": "The user “{displayName}” has been retired."
    }
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "es": {
    "action": {
      "create": "Crear usuario web"
    },
    "header": {
      "sitewideRole": "Rol de sitio"
    },
    "alert": {
      "retire": "El usuario \"{displayName}\" ha sido retirado"
    }
  },
  "fr": {
    "action": {
      "create": "Créer un utilisateur web"
    },
    "heading": [
      "Les utilisateurs web ont des comptes sur ce site pour superviser et administrer les projets sur ce serveur. Les administrateurs peuvent gérer tout ce qui se trouve sur le site. Les utilisateurs n'ayant aucun rôle sur l'ensemble du site peuvent toujours être nommés gestionnaires de projet pour n'importe quel projet, à partir des paramètres de ce projet. Les administrateurs sur l'ensemble du site et certains rôles de projet peuvent utiliser leurs navigateurs pour remplir des formulaires. Pour soumettre des données à travers une application telle que {collect}, créez des utilisateurs d'application pour chaque projet."
    ],
    "header": {
      "sitewideRole": "Rôle sur l'ensemble du site"
    },
    "alert": {
      "create": "Un utilisateur a été créé avec succès pour \"{displayName}\".",
      "assignRole": "Succès ! \"{displayName}\" a reçu le rôle de \"{roleName}\" pour l'ensemble du site.",
      "resetPassword": "Le mot de passe pour \"{displayName}\" a été invalidé. Un courrier électronique a été envoyé à {email} avec des instructions sur la manière de procéder.",
      "retire": "L'utilisateur {displayName}a été supprimé."
    }
  }
}
</i18n>
