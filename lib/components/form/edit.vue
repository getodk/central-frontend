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
    <loading :state="awaitingResponse"/>
    <form-form v-if="form" :initial-xml="form.xml" @submit-record="update">
      <button type="submit" class="btn btn-info">Save</button>
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
      awaitingResponse: false,
      form: null
    };
  },
  computed: {
    xmlFormId() {
      return this.$route.params.xmlFormId;
    }
  },
  created() {
    this.fetchData();
  },
  watch: {
    $route() {
      this.fetchData();
      this.alerts = [];
    }
  },
  methods: {
    up() {
      return 1;
    },
    fetchData() {
      this.form = null;
      this
        .get(`/forms/${this.xmlFormId}`)
        .then(response => {
          this.form = response.data;
        })
        .catch(error => console.error(error));
    },
    update(data) { // eslint-disable-line no-unused-vars
      // eslint-disable-next-line no-alert
      alert("The API doesn't have an endpoint for this yet.");
    }
  },
  components: { FormForm }
};
</script>
