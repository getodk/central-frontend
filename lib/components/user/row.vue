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
    <td>{{ user.email }}</td>
    <td class="user-role">
      <form>
        <div class="form-group">
          <select ref="select" :value="selectedRole" :disabled="disabled"
            :title="title" class="form-control" aria-label="Sitewide Role"
            @change="assignRole">
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
            <a href="#" @click.prevent="$emit('reset-password', user)">
              Reset password
            </a>
          </li>
        </ul>
      </div>
    </td>
  </tr>
</template>

<script>
import request from '../../mixins/request';
import { noop } from '../../util/util';
import { requestData } from '../../store/modules/request';

export default {
  name: 'UserRow',
  mixins: [request()],
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
    title() {
      if (this.user.id !== this.currentUser.id) return '';
      return 'You may not edit your own Sitewide Role.';
    },
    actionsButtonId() {
      return `user-row-actions-button${this.user.id}`;
    }
  },
  methods: {
    assignRole() {
      // Using this.$refs rather than passing $event.target.value to the method
      // in order to facilitate testing.
      this.selectedRole = this.$refs.select.value;
      this.request({
        method: this.selectedRole === 'admin' ? 'POST' : 'DELETE',
        url: `/assignments/admin/${this.user.id}`
      })
        .then(() => {
          this.$emit('assigned-role', this.user, this.selectedRole === 'admin');
        })
        .catch(noop);
    }
  }
};
</script>

<style lang="sass">
#user-list-table td {
  vertical-align: middle;

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
