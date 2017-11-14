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
    <navbar/>
    <div class="container">
      <div class="row">
        <div class="col-xs-12 col-md-offset-1 col-md-10">
          <!-- As with <component> below, listen for 'view' events from
          <breadcrumbs>. -->
          <breadcrumbs :breadcrumbs="breadcrumbs" @view="setView"/>

          <!--
          Now that we have rendered the app skeleton, render the single
          component that holds the page content. Meanwhile, this App component
          will listen for 'view' and 'breadcrumbs' events.
          https://vuejs.org/v2/guide/components.html#Dynamic-Components

          There is probably a better way to implement this. In particular, I
          want to investigate the Vue.js router:
          https://router.vuejs.org/en/
          -->
          <component :is="view" v-bind="viewProps"
            @view="setView" @breadcrumbs="setBreadcrumbs">
          </component>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Breadcrumbs from './breadcrumbs.vue';
import FormList from './form/list.vue';
import Navbar from './navbar.vue';

export default {
  data: () => ({
    breadcrumbs: [],
    view: FormList,
    viewProps: {}
  }),
  methods: {
    setView(view, props) {
      this.view = view;
      this.viewProps = props != null ? props : {};
    },
    setBreadcrumbs(breadcrumbs) {
      this.breadcrumbs = breadcrumbs;
    }
  },
  components: { Breadcrumbs, Navbar }
};
</script>
