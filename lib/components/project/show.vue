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
    <page-head v-show="maybeProject.success">
      <template slot="title">
        {{ maybeProject.success ? maybeProject.data.name : '' }}
      </template>
      <template slot="tabs">
        <li :class="tabClass('')" role="presentation">
          <router-link :to="tabPath('')">Overview</router-link>
        </li>
      </template>
    </page-head>
    <page-body>
      <loading :state="maybeProject.awaiting"/>
      <!-- It might be possible to remove this <div> element and move the v-show
      to <keep-alive> or <router-view>. However, I'm not sure that <keep-alive>
      supports that use case. -->
      <div v-show="maybeProject.success">
        <keep-alive>
          <!-- <router-view> is immediately created and can send its own
          requests even before the server has responded to ProjectHome's
          requests for the project and the project's app users. -->
          <router-view :project-id="projectId"
            :maybe-field-keys="maybeFieldKeys"/>
        </keep-alive>
      </div>
    </page-body>
  </div>
</template>

<script>
import MaybeData from '../../maybe-data';
import tab from '../../mixins/tab';

export default {
  name: 'ProjectShow',
  mixins: [tab()],
  props: {
    projectId: {
      type: String,
      required: true
    },
    maybeProject: {
      type: MaybeData,
      required: true
    },
    maybeFieldKeys: {
      type: MaybeData,
      required: true
    }
  },
  methods: {
    tabPathPrefix() {
      return `/projects/${this.projectId}`;
    }
  }
};
</script>
