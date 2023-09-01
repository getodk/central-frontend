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
<template>
  <tr class="user-row" :class="{ success: user.id === highlighted }">
    <td class="display-name">
      <router-link :to="userPath(user.id)" v-tooltip.text>{{ user.displayName }}</router-link>
    </td>
    <td class="email"><span v-tooltip.text>{{ user.email }}</span></td>
    <td class="user-role">
      <form>
        <div class="form-group">
          <select class="form-control" :value="selectedRole"
            :aria-label="$t('field.sitewideRole')"
            :aria-disabled="disabled || awaitingResponse"
            v-tooltip.aria-describedby="disabled ? $t('cannotAssignRole') : null"
            @change="assignRole($event.target.value)">
            <option value="admin">{{ $t('role.admin') }}</option>
            <option value="">{{ $t('role.none') }}</option>
          </select>
          <span class="spinner-container">
            <spinner :state="awaitingResponse"/>
          </span>
        </div>
      </form>
    </td>
    <td>
      <div class="dropdown">
        <button :id="actionsButtonId" type="button"
          class="btn btn-default dropdown-toggle" data-toggle="dropdown"
          aria-haspopup="true" aria-expanded="false">
          <span class="icon-cog"></span><span class="caret"></span>
        </button>
        <ul class="dropdown-menu dropdown-menu-right"
          :aria-labelledby="actionsButtonId">
          <li>
            <router-link :to="userPath(user.id)" class="edit-profile">
              {{ $t('action.editProfile') }}
            </router-link>
          </li>
          <li v-if="!config.oidcEnabled" :class="{ disabled }">
            <a class="reset-password" href="#"
              v-tooltip.aria-describedby="disabled ? $t('cannotResetPassword') : null"
              @click.prevent="$emit('reset-password', user)">
              {{ $t('action.resetPassword') }}&hellip;
            </a>
          </li>
          <li :class="{ disabled }">
            <a class="retire-user" href="#"
              v-tooltip.aria-describedby="disabled ? $t('cannotRetire') : null"
              @click.prevent="$emit('retire', user)">
              {{ $t('action.retire') }}&hellip;
            </a>
          </li>
        </ul>
      </div>
    </td>
  </tr>
</template>

<script>
import Spinner from '../spinner.vue';

import useRequest from '../../composables/request';
import useRoutes from '../../composables/routes';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
import { useRequestData } from '../../request-data';

export default {
  name: 'UserRow',
  components: { Spinner },
  inject: ['config'],
  props: {
    user: {
      type: Object,
      required: true
    },
    admin: Boolean,
    highlighted: Number
  },
  emits: ['assigned-role', 'reset-password', 'retire'],
  setup() {
    const { currentUser } = useRequestData();
    const { request, awaitingResponse } = useRequest();
    const { userPath } = useRoutes();
    return { currentUser, request, awaitingResponse, userPath };
  },
  data() {
    return {
      selectedRole: this.admin ? 'admin' : ''
    };
  },
  computed: {
    disabled() {
      return this.user.id === this.currentUser.id;
    },
    actionsButtonId() {
      return `user-row-actions-button${this.user.id}`;
    }
  },
  methods: {
    assignRole(role) {
      this.selectedRole = role;
      this.request({
        method: this.selectedRole === 'admin' ? 'POST' : 'DELETE',
        url: apiPaths.assignment('admin', this.user.id)
      })
        .then(() => {
          this.$emit('assigned-role', this.user, this.selectedRole === 'admin');
        })
        .catch(noop);
    }
  }
};
</script>

<style lang="scss">
#user-list-table td {
  vertical-align: middle;

  &.display-name, &.email {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &.user-role {
    .form-group {
      margin-bottom: 0;
      padding-bottom: 0;
    }

    .form-control {
      display: inline-block;
      width: 150px;
    }

    .spinner-container {
      margin-left: 15px;
      // Spinner is positioned absolutely.
      position: relative;
    }
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    "cannotAssignRole": "You may not edit your own Sitewide Role.",
    "field": {
      "sitewideRole": "Sitewide Role"
    },
    // An Administrator may reset the password for another Web User, but not for
    // their own account.
    "cannotResetPassword": "You may not reset your own password on this page. To change your password, edit your profile.",
    // An Administrator may retire other Web Users, but not their own account.
    "cannotRetire": "You may not retire yourself.",
    "action": {
      "retire": "Retire user"
    }
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "cannotAssignRole": "Nemůžete změnit svou vlastní roli úplného přístupu.",
    "field": {
      "sitewideRole": "Role úplného přístupu"
    },
    "cannotResetPassword": "Na této stránce nelze resetovat vlastní heslo. Chcete-li změnit své heslo, upravte svůj profil.",
    "cannotRetire": "Nemůžete sám sebe uspat",
    "action": {
      "retire": "Uspat uživatele"
    }
  },
  "de": {
    "cannotAssignRole": "Sie dürfen Ihre seitenweite Rolle nicht bearbeiten.",
    "field": {
      "sitewideRole": "Seitenweite Rolle"
    },
    "cannotResetPassword": "Sie können Ihr eigenes Passwort auf dieser Seite nicht zurücksetzen. Um Ihr Passwort zu ändern, bearbeiten Sie Ihr Profil.",
    "cannotRetire": "Sie dürfen sich nicht selbst deaktivieren.",
    "action": {
      "retire": "User deaktivieren"
    }
  },
  "es": {
    "cannotAssignRole": "No puede editar su propio rol en el proyecto",
    "field": {
      "sitewideRole": "Rol de sitio"
    },
    "cannotResetPassword": "No puede restablecer su propia contraseña en esta página. Para cambiar su contraseña, edite su perfil.",
    "cannotRetire": "No puede retirar su propio usuario",
    "action": {
      "retire": "Retirar usuario"
    }
  },
  "fr": {
    "cannotAssignRole": "Vous ne pouvez pas modifier votre propre rôle sur le site.",
    "field": {
      "sitewideRole": "Rôle sur l'ensemble du site"
    },
    "cannotResetPassword": "Vous ne devriez pas réinitialiser votre propre mot de passe sur cette page. Pour le changer, éditez votre profil.",
    "cannotRetire": "Vous ne pouvez pas supprimer votre propre compte.",
    "action": {
      "retire": "Supprimer l'utilisateur"
    }
  },
  "id": {
    "cannotAssignRole": "Anda tidak dapat mengubah Peran Seluruh Situs Anda sendiri.",
    "field": {
      "sitewideRole": "Peran Seluruh Situs"
    },
    "cannotRetire": "Anda tidak dapat memberhentikan diri sendiri.",
    "action": {
      "retire": "Pengguna Berhenti"
    }
  },
  "it": {
    "cannotAssignRole": "Non puoi modificare il tuo ruolo nel sito.",
    "field": {
      "sitewideRole": "Ruolo per tutto il sito"
    },
    "cannotResetPassword": "Non puoi reimpostare la tua password in questa pagina. Per cambiare la tua password, modifica il tuo profilo.",
    "cannotRetire": "Non è possibile ritirare se stessi",
    "action": {
      "retire": "Ritira utente"
    }
  },
  "ja": {
    "cannotAssignRole": "自分自身のサーバーでの役割を編集できません。",
    "field": {
      "sitewideRole": "サーバーでの役割"
    },
    "cannotRetire": "自分自身を除外させることはできません。",
    "action": {
      "retire": "ユーザーの除外"
    }
  },
  "sw": {
    "cannotAssignRole": "Huenda usihariri Jukumu lako la Tovuti nzima.",
    "field": {
      "sitewideRole": "Jukumu la Tovuti nzima"
    },
    "cannotResetPassword": "Huwezi kuweka upya nenosiri lako kwenye ukurasa huu. Ili kubadilisha nenosiri lako, hariri wasifu wako.",
    "cannotRetire": "Huenda usistaafu mwenyewe.",
    "action": {
      "retire": "Staafu mtumiaji"
    }
  }
}
</i18n>
