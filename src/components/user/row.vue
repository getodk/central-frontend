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
  <tr :class="{ success: user.id === highlighted }">
    <td class="user-display-name">
      <router-link :to="userPath(user.id)">{{ user.displayName }}</router-link>
    </td>
    <td class="user-email">{{ user.email }}</td>
    <td class="user-role">
      <form>
        <div class="form-group">
          <select class="form-control" :value="selectedRole"
            :disabled="disabled" :title="selectTitle" aria-label="Sitewide Role"
            @change="assignRole($event.target.value)">
            <option value="admin">Administrator</option>
            <option value="">None</option>
          </select>
          <span class="spinner-container">
            <spinner :state="awaitingResponse"/>
          </span>
        </div>
      </form>
    </td>
    <td class="user-actions">
      <div class="dropdown">
        <button :id="actionsButtonId" type="button"
          class="btn btn-primary dropdown-toggle" data-toggle="dropdown"
          aria-haspopup="true" aria-expanded="false">
          <span class="icon-cog"></span><span class="caret"></span>
        </button>
        <ul :aria-labelledby="actionsButtonId" class="dropdown-menu">
          <li>
            <router-link :to="userPath(user.id)" class="edit-profile">
              Edit profile
            </router-link>
          </li>
          <li>
            <a class="reset-password" href="#"
              @click.prevent="$emit('reset-password', user)">
              Reset password
            </a>
          </li>
          <li :class="{ disabled }" :title="retireTitle">
            <a class="retire-user" href="#" @click.prevent="retire">
              Retire user
            </a>
          </li>
        </ul>
      </div>
    </td>
  </tr>
</template>

<script>
import Spinner from '../spinner.vue';
import request from '../../mixins/request';
import routes from '../../mixins/routes';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
import { requestData } from '../../store/modules/request';

export default {
  name: 'UserRow',
  components: { Spinner },
  mixins: [request(), routes()],
  props: {
    user: {
      type: Object,
      required: true
    },
    admin: {
      type: Boolean,
      required: true
    },
    highlighted: Number // eslint-disable-line vue/require-default-prop
  },
  data() {
    return {
      awaitingResponse: false,
      selectedRole: this.admin ? 'admin' : ''
    };
  },
  computed: {
    ...requestData(['currentUser']),
    disabled() {
      return this.user.id === this.currentUser.id || this.awaitingResponse;
    },
    selectTitle() {
      return this.user.id === this.currentUser.id
        ? 'You may not edit your own Sitewide Role.'
        : '';
    },
    actionsButtonId() {
      return `user-row-actions-button${this.user.id}`;
    },
    retireTitle() {
      return this.user.id === this.currentUser.id
        ? 'You may not retire yourself.'
        : '';
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
    },
    retire() {
      if (!this.disabled) this.$emit('retire', this.user);
    }
  }
};
</script>

<style lang="scss">
#user-list-table td {
  vertical-align: middle;

  &.user-display-name, &.user-email {
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
