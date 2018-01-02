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
    <alerts :list="alerts" @dismiss="dismissAlert"/>
    <form-form @submit-record="create">
      <button type="submit" class="btn btn-success" :disabled="awaitingResponse">
        Create Form
      </button>
      <router-link to="/forms" class="btn btn-default" role="button">
        Back to Forms
      </router-link>
    </form-form>
  </div>
</template>

<script>
import FormForm from './form.vue';

import alert from '../../mixins/alert';
import request from '../../mixins/request';

export default {
  mixins: [alert, request],
  data() {
    return {
      alerts: [],
      awaitingResponse: false
    };
  },
  methods: {
    create(data) {
      const headers = { 'Content-Type': 'application/xml' };
      this
        .post('/forms', data, { headers })
        .then(response => {
          const query = { newForm: response.data.xmlFormId };
          this.$router.push({ path: '/forms', query });
        })
        .catch(error => console.error(error));
    }
  },
  components: { FormForm }
};
</script>
