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
  <page-body v-if="form == null">
    <loading :state="awaitingResponse"/>
  </page-body>
  <div v-else>
    <page-head>
      <template slot="title">{{ form.name || form.xmlFormId }}</template>
      <template slot="tabs">
        <li :class="tabClass('')" role="presentation">
          <router-link :to="tabPath('')">Overview</router-link>
        </li>
        <li :class="tabClass('submissions')" role="presentation">
          <router-link :to="tabPath('submissions')">Submissions</router-link>
        </li>
        <li :class="tabClass('settings')" role="presentation">
          <router-link :to="tabPath('settings')">Settings</router-link>
        </li>
      </template>
    </page-head>
    <page-body>
      <keep-alive>
        <router-view :form="form" @state-change="updateState"/>
      </keep-alive>
    </page-body>
  </div>
</template>

<script>
import Form from '../../presenters/form';
import request from '../../mixins/request';
import tab from '../../mixins/tab';

export default {
  name: 'FormShow',
  mixins: [request(), tab()],
  data() {
    return {
      requestId: null,
      form: null
    };
  },
  computed: {
    xmlFormId() {
      return this.$route.params.xmlFormId;
    }
  },
  watch: {
    xmlFormId() {
      this.fetchData();
    }
  },
  created() {
    this.fetchData();
  },
  methods: {
    fetchData() {
      this.form = null;
      const headers = { 'X-Extended-Metadata': 'true' };
      this
        .get(`/forms/${this.xmlFormId}`, { headers })
        .then(({ data }) => {
          this.form = new Form(data);
        })
        .catch(() => {});
    },
    tabPathPrefix() {
      return `/forms/${this.xmlFormId}`;
    },
    updateState(newState) {
      this.form = this.form.with({ state: newState });
    }
  }
};
</script>
