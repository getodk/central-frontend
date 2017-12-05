<!--
Copyright 2017 Super Adventure Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/nafundi/super-adventure/blob/master/NOTICE.

This file is part of Super Adventure. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of Super Adventure,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div>
    <breadcrumbs :list="breadcrumbs"/>
    <alert type="danger" :message="error"/>
    <form-form focus @submit-record="create">
      <button type="submit" class="btn btn-success" :disabled="disabled">
        Create Form
      </button>
      <router-link to="/forms" class="btn btn-default" role="button">
        Back to Forms
      </router-link>
    </form-form>
  </div>
</template>

<script>
import axios from 'axios';

import FormForm from './form.vue';

const breadcrumbs = [
  { title: 'Forms', to: '/forms' },
  { title: 'New Form' }
];

export default {
  data() {
    return {
      breadcrumbs,
      error: null,
      disabled: false
    }
  },
  methods: {
    create(data) {
      this.disabled = true;
      axios
        .post('/forms', data)
        .then(() => this.$router.push('/forms'))
        .catch(error => {
          this.error = 'Something went wrong while creating the form.';
          this.disabled = false;
        });
    }
  },
  components: { FormForm }
};
</script>
