<!--
Copyright 2022 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div id="home-summary">
    <div>
      <loading :state="loadingProjects"/>
      <home-summary-item v-if="projects != null" icon="archive"
        :count="projects.length">
        <template #title>{{ $tc('plural.project', projects.length) }}</template>
        <template #body>{{ $t('projects.body') }}</template>
      </home-summary-item>
    </div>
    <div v-if="currentUser.can('user.list')">
      <loading :state="loadingUsers"/>
      <home-summary-item v-if="users != null" to="/users" icon="user-circle"
        :count="users.length">
        <template #title>{{ $tc('plural.user', users.length) }}</template>
        <template #body>{{ $t('users.body') }}</template>
      </home-summary-item>
    </div>
    <div>
      <home-summary-item to="https://docs.getodk.org/central-intro/"
        icon="book">
        <template #title>{{ $t('docs.title') }}</template>
        <template #body>{{ $t('docs.body') }}</template>
      </home-summary-item>
    </div>
    <div>
      <home-summary-item to="https://forum.getodk.org/" icon="comments-o">
        <template #title>{{ $t('forum.title') }}</template>
        <template #body>{{ $t('forum.body') }}</template>
      </home-summary-item>
    </div>
  </div>
</template>

<script>
import HomeSummaryItem from './summary/item.vue';
import Loading from '../loading.vue';

import { noop } from '../../util/util';
import { requestData } from '../../store/modules/request';

export default {
  name: 'HomeSummary',
  components: { HomeSummaryItem, Loading },
  computed: {
    ...requestData(['currentUser', 'users', 'projects']),
    loadingProjects() {
      return this.$store.getters.initiallyLoading(['projects']);
    },
    loadingUsers() {
      return this.$store.getters.initiallyLoading(['users']);
    }
  },
  created() {
    this.fetchData();
  },
  methods: {
    fetchData() {
      if (this.currentUser.can('user.list'))
        this.$store.dispatch('get', [{ key: 'users', url: '/v1/users' }]).catch(noop);
    }
  }
};
</script>

<style lang="scss">
@use 'sass:math';
@import '../../assets/scss/variables';

#home-summary {
  background: $color-subpanel-background;
  border-bottom: 2px solid $color-subpanel-border;
  display: flex;
  padding-bottom: 25px;
  padding-left: 15px;
  padding-right: 15px;
  margin: 0 -15px 35px;

  > div {
    $border-width: 1px;
    $hpadding: 20px;
    border-left: $border-width solid $color-subpanel-border;
    box-sizing: content-box;
    padding-left: $hpadding;
    padding-right: $hpadding;
    padding-top: 3px;
    padding-bottom: 3px;
    // width(#home-summary) = 4 * width(#home-summary > div) + 6 * $hpadding + 3 * $border-width
    width: calc(25% - #{math.ceil(math.div(6 * $hpadding + 3 * $border-width, 4))});

    &:first-child {
      border-left: none;
      padding-left: 0;
    }
    &:last-child { padding-right: 0; }
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    "projects": {
      "body": "Central is organized into Projects, which each contain their own Forms and related data."
    },
    "users": {
      "body": "Users can be assigned to Projects to manage them, or to collect or review submitted data."
    },
    "docs": {
      "title": "Docs",
      "body": "There is a getting started guide and user documentation available on the ODK Docs website."
    },
    "forum": {
      "title": "Forum",
      "body": "You can always get help from others on the forum, where you can also search previous questions."
    }
  }
}
</i18n>
