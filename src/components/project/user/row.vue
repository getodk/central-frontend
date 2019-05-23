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
    <td>{{ assignment.actor.displayName }}</td>
    <td>
      <form>
        <div class="form-group">
          <select ref="select" :value="selectedRole" :disabled="disabled"
            :title="title" class="form-control" aria-label="Project Role"
            @change="assignRole">
            <option value="manager">Manager</option>
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
    projectId: {
      type: String,
      required: true
    },
    assignment: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      awaitingResponse: false,
      selectedRole: this.assignment.manager ? 'manager' : ''
    };
  },
  computed: {
    ...requestData(['currentUser', 'project']),
    disabled() {
      return this.project == null || this.project.archived ||
        this.assignment.actor.id === this.currentUser.id ||
        this.awaitingResponse;
    },
    title() {
      if (this.assignment.actor.id !== this.currentUser.id) return '';
      return 'You may not edit your own Project Role.';
    }
  },
  methods: {
    assignRole() {
      // Using this.$refs rather than passing $event.target.value to the method
      // in order to facilitate testing.
      const newRole = this.$refs.select.value;

      this.$emit('increment-count');
      const manager = newRole === 'manager';
      const method = manager ? 'POST' : 'DELETE';
      const { actor } = this.assignment;
      const url = `/projects/${this.projectId}/assignments/manager/${actor.id}`;
      const { currentRoute } = this.$store.state.router;
      this.request({ method, url })
        .then(() => {
          this.$emit('success', this.assignment, manager);
        })
        .catch(noop)
        .finally(() => {
          if (this.$store.state.router.currentRoute === currentRoute)
            this.$emit('decrement-count');
        });

      this.selectedRole = newRole;
    }
  }
};
</script>

<style lang="scss">
#project-user-list td {
  vertical-align: middle;

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
