<!--
Copyright 2019 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/opendatakit/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <tr class="project-form-workflow-row">
    <template v-if="frozen">
      <td class="form-name">
        <router-link :to="formOverviewPath" :title="form.nameOrId()">
          {{ form.nameOrId() }}
        </router-link>
      </td>
      <td>
        <div class="form-group">
          <select class="form-control"
            :class="{ 'uncommitted-change': stateChanged }"
            :value="changes.current.state" aria-label="State"
            @change="updateState($event.target.value)">
            <option value="open">Open</option>
            <option value="closing">Closing</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </td>
    </template>
    <template v-else>
      <td></td>
      <td v-for="fieldKey of fieldKeysWithToken" :key="fieldKey.id">
        <div class="checkbox">
          <label>
            <input type="checkbox"
              :class="{ 'uncommitted-change': accessChanged(fieldKey) }"
              :checked="changes.current.access[fieldKey.id]"
              aria-label="App User Access"
              @change="updateAccess(fieldKey, $event.target.checked)">
          </label>
        </div>
      </td>
      <td></td>
    </template>
  </tr>
</template>

<script>
import { mapGetters } from 'vuex';

import Form from '../../../presenters/form';

export default {
  name: 'ProjectFormWorkflowRow',
  props: {
    form: {
      type: Form,
      required: true
    },
    changes: {
      type: Object,
      required: true
    },
    frozen: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    ...mapGetters(['fieldKeysWithToken']),
    formOverviewPath() {
      return `/projects/${this.form.projectId}/forms/${this.form.encodedId()}`;
    },
    stateChanged() {
      return this.changes.current.state !== this.changes.previous.state;
    }
  },
  methods: {
    accessChanged(fieldKey) {
      return this.changes.current.access[fieldKey.id] !==
        this.changes.previous.access[fieldKey.id];
    },
    updateState(state) {
      this.$emit('update:state', this.form, state);
    },
    updateAccess(fieldKey, accessible) {
      this.$emit('update:access', this.form, fieldKey, accessible);
    }
  }
};
</script>

<style lang="scss">
.project-form-workflow-row {
  .form-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .form-group {
    margin-bottom: 0;
    padding-bottom: 0;
  }

  select {
    width: 120px;
  }

  .checkbox {
    margin-bottom: 0;
    margin-left: 6px;
    margin-top: 5px;
  }
}
</style>
