<template>
  <div>
    <navbar></navbar>
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
            @view="setView" @breadcrumbs="replaceBreadcrumbs">
          </component>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Breadcrumbs from './breadcrumbs.vue';
import Dashboard from './dashboard.vue';
import Navbar from './navbar.vue';

export default {
  data: () => ({
    breadcrumbs: [{ title: 'Dashboard', view: Dashboard }],
    view: Dashboard,
    viewProps: {}
  }),
  methods: {
    setView(view, props) {
      this.breadcrumbs.splice(1);
      this.view = view;
      this.viewProps = props != null ? props : {};
    },
    // Replaces any existing breadcrumbs with those specified.
    replaceBreadcrumbs(breadcrumbs) {
      // Keep the top-level breadcrumb: splice starting at 1.
      this.breadcrumbs.splice(1);
      for (const breadcrumb of breadcrumbs)
        this.breadcrumbs.push(breadcrumb);
    },
  },
  components: {
    breadcrumbs: Breadcrumbs,
    navbar: Navbar
  }
};
</script>
