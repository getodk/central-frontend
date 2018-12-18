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
  <div>
    <page-head v-show="project != null">
      <template slot="title">
        {{ project != null ? project.name : '' }}
      </template>
      <template slot="tabs">
        <li :class="tabClass('')" role="presentation">
          <router-link :to="tabPath('')">Overview</router-link>
        </li>
      </template>
    </page-head>
    <page-body>
      <loading :state="awaitingResponse"/>
      <!-- It might be possible to remove this <div> element and move the v-show
      to <keep-alive> or <router-view>. However, I'm not sure that <keep-alive>
      supports that use case. -->
      <div v-show="project != null">
        <keep-alive>
          <!-- <router-view> is immediately created and can send its own
          requests even before the server has responded to ProjectShow's request
          for the project. -->
          <router-view :project-id="id"/>
        </keep-alive>
      </div>
    </page-body>
  </div>
</template>

<script>
import request from '../../mixins/request';
import tab from '../../mixins/tab';

export default {
  name: 'ProjectShow',
  mixins: [request(), tab()],
  data() {
    return {
      requestId: null,
      project: null
    };
  },
  computed: {
    id() {
      return parseInt(this.$route.params.id, 10);
    }
  },
  watch: {
    id() {
      this.fetchData();
    }
  },
  created() {
    this.fetchData();
  },
  methods: {
    fetchData() {
      this.project = null;
      const headers = { 'X-Extended-Metadata': 'true' };
      this.get(`/projects/${this.id}`, { headers })
        .then(({ data }) => {
          this.project = data;
        })
        .catch(() => {});
    },
    tabPathPrefix() {
      return `/projects/${this.id}`;
    }
  }
};
</script>
