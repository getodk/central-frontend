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
  <div id="user-edit-basic-details" class="panel panel-simple">
    <div class="panel-heading"><h1 class="panel-title">Basic Details</h1></div>
    <div class="panel-body">
      <form @submit.prevent="submit">
        <label class="form-group">
          <input v-model.trim="email" type="email" class="form-control"
            placeholder="Email address *" required autocomplete="off">
          <span class="form-label">Email address *</span>
        </label>
        <label class="form-group">
          <input v-model.trim="displayName" type="text" class="form-control"
            placeholder="Display name *" required>
          <span class="form-label">Display name *</span>
        </label>
        <button :disabled="awaitingResponse" type="submit"
          class="btn btn-primary">
          Update details <spinner :state="awaitingResponse"/>
        </button>
      </form>
    </div>
  </div>
</template>

<script>
import Spinner from '../../spinner.vue';
import request from '../../../mixins/request';
import { noop } from '../../../util/util';
import { requestData } from '../../../store/modules/request';

export default {
  name: 'UserEditBasicDetails',
  components: { Spinner },
  mixins: [request()],
  data() {
    const { email, displayName } = this.$store.state.request.data.user;
    return {
      awaitingResponse: false,
      email,
      displayName
    };
  },
  computed: requestData(['currentUser', 'user']),
  methods: {
    submit() {
      const patchData = { email: this.email, displayName: this.displayName };
      this.patch(`/users/${this.user.id}`, patchData)
        .then(response => {
          this.$store.commit('setData', {
            key: 'user',
            value: this.user.with(response.data)
          });
          if (this.user.id === this.currentUser.id) {
            this.$store.commit('setData', {
              key: 'currentUser',
              value: this.currentUser.with(response.data)
            });
          }
          this.$alert().success('User details saved!');
        })
        .catch(noop);
    }
  }
};
</script>
