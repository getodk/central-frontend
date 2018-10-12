<template>
  <div>
    <page-head>
      <template slot="title">{{ displayName }}</template>
    </page-head>
    <page-body>
      <div class="row">
        <div class="col-xs-7">
          <form-edit-basic-details @update:session="afterUpdateSession"/>
        </div>
        <div class="col-xs-5">
          <form-edit-password/>
        </div>
      </div>
    </page-body>
  </div>
</template>

<script>
import FormEditBasicDetails from './edit/basic-details.vue';
import FormEditPassword from './edit/password.vue';

export default {
  name: 'AccountEdit',
  components: { FormEditBasicDetails, FormEditPassword },
  data() {
    return {
      displayName: this.$session.user.displayName
    };
  },
  methods: {
    afterUpdateSession() {
      this.displayName = this.$session.user.displayName;
      this.$emit('update:session');
    }
  }
};
</script>
