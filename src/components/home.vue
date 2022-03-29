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
  <div>
    <div id="home-heading">{{ $t('heading[0]') }}</div>
    <home-summary/>
    <div id="home-news-container">
      <home-news/>
      <home-config-section v-if="homeConfig.title != null"
        :title="homeConfig.title" :body="homeConfig.body"/>
    </div>
    <project-list/>
  </div>
</template>

<script>
import { mapState } from 'vuex';

import HomeNews from './home/news.vue';
import HomeSummary from './home/summary.vue';
import ProjectList from './project/list.vue';

import { loadAsync } from '../util/async-components';
import { noop } from '../util/util';

export default {
  name: 'Home',
  components: {
    HomeConfigSection: loadAsync('HomeConfigSection'),
    HomeNews,
    HomeSummary,
    ProjectList
  },
  computed: mapState({ homeConfig: (state) => state.config.home }),
  created() {
    this.fetchData();
  },
  methods: {
    fetchData() {
      this.$store.dispatch('get', [{
        key: 'projects',
        url: '/v1/projects',
        extended: true
      }]).catch(noop);
    }
  }
};
</script>

<style lang="scss">
@import '../assets/scss/variables';

#home-heading {
  background: $color-subpanel-background;
  color: $color-accent-primary;
  font-size: 35px;
  font-weight: 600;
  letter-spacing: -0.03em;
  margin-left: -15px;
  margin-right: -15px;
  padding: 20px 15px 12px 15px;
}

#home-news-container {
  display: flex;
  > * { flex: 1; }
}
</style>

<i18n lang="json5">
{
  "en": {
    "heading": [
      "Welcome to Central."
    ]
  }
}
</i18n>
