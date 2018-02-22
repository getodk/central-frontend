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
    <page-head>
      <template slot="title">{{ xmlFormId }}</template>
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
        <router-view :xml-form-id="xmlFormId" @alert="hideAlert"/>
      </keep-alive>
    </page-body>
  </div>
</template>

<script>
import alert from '../../mixins/alert';

export default {
  name: 'FormShow',
  mixins: [alert()],
  data() {
    return {
      alert: alert.blank()
    };
  },
  computed: {
    xmlFormId() {
      return this.$route.params.xmlFormId;
    }
  },
  watch: {
    xmlFormId() {
      this.alert = alert.blank();
    }
  },
  methods: {
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
