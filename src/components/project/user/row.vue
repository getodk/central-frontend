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
  <tr>
    <td class="display-name">{{ assignment.actor.displayName }}</td>
    <td>
      <form>
        <div class="form-group">
          <select class="form-control" :value="selectedRoleId"
            :disabled="disabled" :title="title" aria-label="Project Role"
            @change="change($event.target.value)">
            <option v-for="role of $store.getters.projectRoles" :key="role.id"
              :value="role.id">
              {{ role.name }}
            </option>
            <option value="">None</option>
          </select>
          <span class="spinner-container">
            <spinner :state="awaitingResponse"/>
          </span>
        </div>
      </form>
    </td>
  </tr>
</template>

<script>
import request from '../../../mixins/request';
import { noop } from '../../../util/util';
import { requestData } from '../../../store/modules/request';

export default {
  name: 'ProjectUserRow',
  mixins: [request()],
  props: {
    assignment: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      // If two requests are sent, there may be a moment between them when
      // awaitingResponse is `false`.
      awaitingResponse: false,
      selectedRoleId: this.assignment.roleId != null
        ? this.assignment.roleId.toString()
        : ''
    };
  },
  computed: {
    ...requestData(['currentUser', 'roles', 'project']),
    disabled() {
      return this.assignment.actor.id === this.currentUser.id ||
        this.awaitingResponse;
    },
    title() {
      return this.assignment.actor.id === this.currentUser.id
        ? 'You may not edit your own Project Role.'
        : '';
    }
  },
  methods: {
    requestChange(method, roleIdString) {
      if (roleIdString === '') return Promise.resolve();
      const url = `/projects/${this.project.id}/assignments/${roleIdString}/${this.assignment.actor.id}`;
      return this.request({ method, url });
    },
    change(roleIdString) {
      this.$emit('increment-count');
      const previousRoleId = this.selectedRoleId;
      this.selectedRoleId = roleIdString;
      const { currentRoute } = this.$store.state.router;
      // At some point we will likely implement something transactional so that
      // we don't send two requests.
      this.requestChange('DELETE', previousRoleId)
        .then(() => this.requestChange('POST', roleIdString)
          .catch(e => {
            if (previousRoleId !== '' && roleIdString !== '' &&
              this.$store.state.router.currentRoute === currentRoute) {
              this.$emit('change', this.assignment.actor, null, true);
              this.selectedRoleId = '';
            }
            throw e;
          }))
        .then(() => {
          const role = roleIdString !== ''
            ? this.roles.find(r => r.id.toString() === roleIdString)
            : null;
          this.$emit('change', this.assignment.actor, role, false);
        })
        .catch(noop)
        .finally(() => {
          if (this.$store.state.router.currentRoute === currentRoute)
            this.$emit('decrement-count');
        });
    }
  }
};
</script>

<style lang="scss">
#project-user-list td {
  vertical-align: middle;

  &.display-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .form-group {
    margin-bottom: 0;
    padding-bottom: 0;
  }

  .form-control {
    display: inline-block;
    width: 175px;
  }

  .spinner-container {
    margin-left: 15px;
    // Spinner is positioned absolutely.
    position: relative;
  }
}
</style>
