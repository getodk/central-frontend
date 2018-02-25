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
  <page-body v-if="form == null">
    <alert v-bind="alert" @close="alert.state = false"/>
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
      <alert v-bind="alert" @close="alert.state = false"/>
      <keep-alive>
        <router-view :form="form" @alert="hideAlert"/>
      </keep-alive>
    </page-body>
  </div>
</template>

<script>
import alert from '../../mixins/alert';
import request from '../../mixins/request';

export default {
  name: 'FormShow',
  mixins: [alert(), request()],
  data() {
    return {
      alert: alert.blank(),
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
      this.alert = alert.blank();
    }
  },
  created() {
    this.fetchData();
  },
  methods: {
    fetchData() {
      this.form = null;
      this
        .get(`/forms/${this.xmlFormId}`)
        .then(form => {
          this.form = form;
        })
        .catch(() => {});
    },
    tabPath(path) {
      const slash = path !== '' ? '/' : '';
      return `/forms/${this.xmlFormId}${slash}${path}`;
    },
    tabClass(path) {
      return { active: this.$route.path === this.tabPath(path) };
    },
    // FormShow shows any alert passed from the previous page (the page that
    // navigated to FormShow). However, once a component of FormShow indicates
    // through an 'alert' event that it will show its own alert, FormShow hides
    // the alert from the previous page.
    hideAlert() {
      this.alert = alert.blank();
    }
  }
};
</script>
