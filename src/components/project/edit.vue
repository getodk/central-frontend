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
  <div id="project-edit" class="panel panel-simple">
    <div class="panel-heading"><h1 class="panel-title">Basic Details</h1></div>
    <div class="panel-body">
      <form @submit.prevent="submit">
        <label class="form-group">
          <input v-model.trim="name" class="form-control"
            placeholder="Project name *" required>
          <span class="form-label">Project name *</span>
        </label>
        <button :disabled="awaitingResponse" type="submit"
          class="btn btn-primary">
          Save settings <spinner :state="awaitingResponse"/>
        </button>
      </form>
    </div>
  </div>
</template>

<script>
import request from '../../mixins/request';
import { noop } from '../../util/util';
import { requestData } from '../../store/modules/request';

export default {
  name: 'ProjectEdit',
  mixins: [request()],
  data() {
    return {
      awaitingResponse: false,
      name: this.$store.state.request.data.project.name
    };
  },
  computed: requestData(['project']),
  methods: {
    submit() {
      const { name } = this;
      this.patch(`/projects/${this.project.id}`, { name })
        .then(response => {
          this.$store.commit('setData', {
            key: 'project',
            // We do not simply specify response.data, because it does not
            // include extended metadata.
            value: this.project.with({
              name,
              updatedAt: response.data.updatedAt
            })
          });
          this.$alert().success('Project settings saved!');
        })
        .catch(noop);
    }
  }
};
</script>
