<!--
Copyright 2020 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <ul id="navbar-links" class="nav navbar-nav">
    <li :class="{ active: projectsLinkIsActive }">
      <router-link to="/">
        {{ $t('resource.projects') }} <span class="sr-only">{{ $t('current') }}</span>
      </router-link>
    </li>
    <li v-if="canRoute('/users')" id="navbar-links-users"
      :class="{ active: routePathStartsWith('/users') }">
      <router-link to="/users">
        {{ $t('resource.users') }} <span class="sr-only">{{ $t('current') }}</span>
      </router-link>
    </li>
    <li v-if="canRoute('/system/audits')"
      :class="{ active: routePathStartsWith('/system') }">
      <router-link to="/system/audits">
        {{ $t('common.system') }} <span class="sr-only">{{ $t('current') }}</span>
      </router-link>
    </li>
  </ul>
</template>

<script>
import useRoutes from '../../composables/routes';

export default {
  name: 'NavbarLinks',
  setup() {
    const { canRoute } = useRoutes();
    return { canRoute };
  },
  computed: {
    projectsLinkIsActive() {
      return this.$route.path === '/' || this.routePathStartsWith('/projects');
    }
  },
  methods: {
    routePathStartsWith(path) {
      return this.$route.path === path ||
        this.$route.path.startsWith(`${path}/`);
    }
  }
};
</script>

<style lang="scss">
#navbar-links {
  .sr-only { display: none; }
  .active .sr-only { display: block; }
}

@media (min-width: 768px) {
  #navbar-links {
    margin-left: 30px;

    > li + li { margin-left: 10px; }
    #navbar-links-users { margin-left: 40px; }
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    // Used by screen readers to identify the currently-selected navigation tab
    "current": "current"
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "current": "stávající"
  },
  "de": {
    "current": "aktuell"
  },
  "es": {
    "current": "actual"
  },
  "fr": {
    "current": "actuel"
  },
  "id": {
    "current": "Sekarang ini"
  },
  "it": {
    "current": "attuale"
  },
  "ja": {
    "current": "現在"
  },
  "pt": {
    "current": "atual"
  },
  "sw": {
    "current": "sasa"
  },
  "zh-Hant": {
    "current": "目前"
  }
}
</i18n>
