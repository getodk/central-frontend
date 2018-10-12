<template>
  <div id="account-edit-basic-details" class="panel panel-simple">
    <div class="panel-heading"><h1 class="panel-title">Basic Details</h1></div>
    <div class="panel-body">
      <form @submit="submit">
        <label class="form-group">
          <input v-model.trim="email" type="email" class="form-control"
            placeholder="Email address *" required>
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
import request from '../../../mixins/request';
import { logIn } from '../../../session';

export default {
  name: 'FormEditBasicDetails',
  mixins: [request()],
  data() {
    return {
      requestId: null,
      email: this.$session.user.email,
      displayName: this.$session.user.displayName
    };
  },
  methods: {
    submit() {
      const data = {};
      if (this.email !== this.$session.user.email)
        data.email = this.email;
      if (this.displayName !== this.$session.user.displayName)
        data.displayName = this.displayName;
      this.patch(`/users/${this.$session.user.id}`, data)
        .then(response => {
          const { token, expiresAt } = this.$session;
          logIn({ token, expiresAt }, response.data);
          this.$emit('update:session');
          this.$alert().success('Success! Your user details have been updated.');
        })
        .catch(() => {});
    }
  }
};
</script>
