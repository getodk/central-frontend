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
  <modal id="project-new" :state="state" :hideable="!awaitingResponse" backdrop
    @hide="$emit('hide')" @shown="focusInput">
    <template slot="title">Create Project</template>
    <template slot="body">
      <div class="modal-introduction">
        <p>
          Projects group Forms and App Users together to make them easier to
          organize and manage, both on this website and on your data collection
          device.
        </p>
        <p>
          For more information, please see
          <doc-link to="central-projects/">this help article</doc-link>.
        </p>
      </div>
      <form @submit.prevent="submit">
        <label class="form-group">
          <input ref="name" v-model.trim="name" :disabled="awaitingResponse"
            class="form-control" placeholder="My Project name *" required>
          <span class="form-label">Name *</span>
        </label>
        <div class="modal-actions">
          <button :disabled="awaitingResponse" type="submit"
            class="btn btn-primary">
            Create <spinner :state="awaitingResponse"/>
          </button>
          <button :disabled="awaitingResponse" type="button"
            class="btn btn-link" @click="$emit('hide')">
            Cancel
          </button>
        </div>
      </form>
    </template>
  </modal>
</template>

<script>
import request from '../../mixins/request';

export default {
  name: 'ProjectNew',
  mixins: [request()],
  props: {
    state: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      requestId: null,
      name: ''
    };
  },
  methods: {
    focusInput() {
      this.$refs.name.focus();
    },
    submit() {
      this.post('/projects', { name: this.name })
        .then(({ data }) => {
          this.$alert().blank();
          this.name = '';
          this.$emit('success', data);
        })
        .catch(() => {});
    }
  }
};
</script>
