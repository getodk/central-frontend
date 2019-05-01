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
  <div id="user-home">
    <page-head>
      <template slot="title">User Settings</template>
      <template slot="tabs">
        <li :class="tabClass('')" role="presentation">
          <router-link :to="tabPath('')">Web Users</router-link>
        </li>
        <li class="disabled" role="presentation">
          <a href="#" @click.prevent>
            Role Settings <span class="coming-soon">(coming soon)</span>
          </a>
        </li>
      </template>
    </page-head>
    <page-body>
      <router-view/>
    </page-body>
  </div>
</template>

<script>
import tab from '../../mixins/tab';

export default {
  name: 'UserHome',
  mixins: [tab()],
  computed: {
    tabPathPrefix() {
      return '/users';
    }
  }
};
</script>

<style lang="sass">
@import '../../../assets/scss/variables';

#user-home .coming-soon {
  color: $color-text;
  font-size: 10px;
}
</style>
