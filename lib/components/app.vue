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
  <div ref="app">
    <!-- Do not show the navbar until the first time a navigation is confirmed.
    The user's session may change during that time, affecting how the navbar is
    rendered. -->
    <navbar v-show="firstNavigationConfirmed" :session="session"/>
    <alert id="app-alert" v-bind="alert" @close="alert.state = false"/>
    <div class="container-fluid">
      <router-view @update:session="updateSession"/>
    </div>
  </div>
</template>

<script>
import Navbar from './navbar.vue';
import { blankAlert } from '../alert';
import { routerState } from '../router';

export default {
  name: 'App',
  components: { Navbar },
  data() {
    return {
      /* Vue seems to trigger the initial navigation before creating App. If the
      initial navigation is synchronous, Vue seems to confirm the navigation
      before creating App -- in which case firstNavigationConfirmed will be
      initialized to true and the $route watcher will not be called until the
      user navigates elsewhere. However, if the initial navigation is
      asynchronous, Vue seems to create App before waiting to confirm the
      navigation. In that case, firstNavigationConfirmed will be initialized to
      false and the $route watcher will be called once the initial navigation is
      confirmed. */
      firstNavigationConfirmed: routerState.navigations.first.confirmed,
      /*
      this.$session is not a reactive property, so we store a copy of it here in
      order to pass it to Navbar. This copy can change in one of two ways:

        1. The router changes $session along with $route. App watches for
           changes to $route, which is a reactive property.
        2. The router view changes $session, then notes the change by triggering
           an update:session event.

      Between the router, session, and alert, App is doing a fair amount of
      global state management at this point. We may end up wanting to implement
      a more comprehensive state management strategy.
      */
      session: this.$session,
      alert: blankAlert()
    };
  },
  computed: {
    routeAndAlert() {
      return [this.$route, this.alert];
    }
  },
  watch: {
    $route() {
      this.firstNavigationConfirmed = true;
      this.session = this.$session;
    },
    // Using a strategy similar to the one here:
    // https://github.com/vuejs/vue/issues/844
    routeAndAlert([currentRoute, currentAlert], [previousRoute, previousAlert]) {
      // If both the route and alert have changed, the router view will be
      // updated, and if the new alert is visible, it will be shown. On the
      // other hand, if only the route has changed, then if there is an alert
      // currently visible, it will be hidden.
      if (currentRoute !== previousRoute && currentAlert === previousAlert &&
        this.alert.state)
        this.alert.state = false;
    }
  },
  mounted() {
    // The `disabled` class on an <a> element does not prevent keyboard
    // navigation.
    $(this.$refs.app).on('click', 'a.disabled', (event) => {
      event.preventDefault();
    });
  },
  methods: {
    updateSession() {
      this.session = this.$session;
    }
  }
};
</script>

<style lang="sass">
@import '../../assets/scss/bootstrap';
@import '../../assets/scss/icomoon';
@import '../../assets/scss/variables';

#app-alert {
  border-bottom: 1px solid transparent;
  border-left: 1px solid transparent;
  border-right: 1px solid transparent;
  left: 50%;
  margin-left: -250px;
  position: fixed;
  text-align: center;
  top: 34px;
  width: 500px;
  // 1 greater than the Bootstrap maximum
  z-index: 1061;

  &.alert-success {
    border-color: $color-success;
  }

  &.alert-info {
    border-color: $color-info;
  }

  &.alert-danger {
    border-color: $color-danger;
  }
}

// Global styles should go here.

html {
  background-color: $color-accent-secondary;
  min-height: 100%;
}

body {
  background-color: $color-page-background;
  box-shadow: 0 -2px 0 #777 inset;
  color: $color-text;
  min-height: 100vh;
}

h1, .h1 {
  font-size: 30px;
  font-weight: bold;
  letter-spacing: -0.02em;
  margin-bottom: 3px;
}

a:focus {
  background-color: transparentize(#000, 0.94);
  outline: none;
}

[class^="icon-"], [class*=" icon-"] {
  vertical-align: -1px;

  .btn > &:first-child, a > &:first-child {
    margin-right: 6px;
  }

  a > &:first-child {
    // Using inline-block so that the icon is not underlined even when the link
    // has `text-decoration: underline`.
    display: inline-block;
  }
}

/* Bootstrap has an .icon-bar class that is unrelated to IcoMoon, but our
IcoMoon styles end up applying to it, because our IcoMoon selectors select on
the "icon-" class name prefix. To resolve that, we copy the .icon-bar styles for
.navbar-icon-bar and use .navbar-icon-bar wherever we would use .icon-bar. This
should not be an issue for Bootstrap 4, which does not seem to have an .icon-bar
class. */
.navbar-icon-bar {
  @extend .icon-bar;
}

.btn {
  border: none;
  border-radius: 2px;
  font-size: 12px;
  overflow: hidden;
  padding: 6px 10px 5px;
  position: relative;

  &:focus {
    box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.18);
    outline: none;
  }
}

.btn-primary {
  background-color: $color-action-background;

  &:hover, &:focus {
    background-color: $color-action-background-hover;

    &[disabled] {
      background-color: $color-action-background;
    }
  }
}

.btn-secondary {
  @extend .btn-primary;
}

.btn-danger {
  background-color: $color-danger;

  &:hover, &:focus {
    background-color: $color-danger-dark;

    &[disabled] {
      background-color: $color-danger;
    }
  }
}

.btn-link {
  color: $color-action-foreground;
}

.form-group {
  display: block;
  font-weight: normal;
  padding-bottom: 15px;

  .form-control {
    background: $color-input-background;
    border: none;
    border-bottom: 1px solid $color-input-inactive;
    border-radius: 0;
    box-shadow: none;
    position: relative;
    z-index: 1;

    &:focus {
      border-bottom-color: $color-action-foreground;
      box-shadow: none;

      + .form-label {
        color: $color-action-foreground;
      }
    }

    &::placeholder {
      color: $color-text;
    }

    &:placeholder-shown + .form-label {
      transform: translateY(-15px);
    }
  }

  .form-label {
    color: $color-input-inactive;
    display: block;
    font-size: 11px;
    height: 0;
    padding-left: 12px;
    transform: translateY(2px);
    transition: 0.15s transform, 0.15s color;
  }
}

.radio label {
  cursor: default;
}

.has-error {
  .form-label,
  .radio,
  .checkbox,
  &.radio label,
  &.checkbox label {
    color: $color-danger;
  }

  .form-control {
    border-color: $color-danger;

    &:focus {
      border-color: $color-danger-dark;
      box-shadow: none;

      + .form-label {
        color: $color-danger-dark;
      }
    }
  }
}

.table {
  margin-bottom: $margin-bottom-table;

  > thead {
    background-color: $color-table-heading-background;

    > tr > th {
      border-bottom: $border-bottom-table-heading;
      font-size: $font-size-table-heading;
      padding: $padding-table-heading;
    }
  }

  > tbody {
    > tr > td {
      border-top: $border-top-table-data;
      padding: $padding-top-table-data $padding-right-table-data
               $padding-bottom-table-data $padding-left-table-data;
    }
  }

  > thead > tr.success > th,
  > thead > tr > th.success,
  > tbody > tr.success > td,
  > tbody > tr > td.success {
    background-color: $color-success-light;
  }

  > thead > tr.info > th,
  > thead > tr > th.info,
  > tbody > tr.info > td,
  > tbody > tr > td.info {
    background-color: $color-info-light;
  }
}

.table-actions {
  margin-bottom: 20px;
}

.label-primary {
  background-color: $color-action-background;
}

.panel {
  border: none;
  border-radius: 0;

  .panel-heading {
    border-radius: 0;

    .panel-title {
      font-weight: bold;
      letter-spacing: normal;
    }
  }

  .panel-footer {
    background: $color-subpanel-background;
    border-top-color: $color-subpanel-border;
    margin: -15px;
    margin-bottom: -25px;
    margin-top: 20px;
  }
}

.panel-default {
  box-shadow: 0 0 24px rgba(0, 0, 0, 0.25), 0 35px 115px rgba(0, 0, 0, 0.28);

  .panel-heading {
    background-color: $color-accent-primary;
    color: #fff;

    .panel-title {
      font-size: 18px;
      letter-spacing: -0.02em;
    }
  }

  .panel-body {
    padding: 25px 15px;

    .form-group .form-control {
      background-color: $color-panel-input-background;
    }
  }
}

.panel-main {
  margin-top: 70px;
}

// Intended to be styled similarly to .table.
.panel-simple {
  background-color: transparent;
  box-shadow: none;

  .panel-heading {
    background-color: $color-table-heading-background;
    border-bottom: $border-bottom-table-heading;
    padding: $padding-table-heading;

    .panel-title {
      font-size: $font-size-table-heading;
      line-height: inherit;
    }
  }

  .panel-body {
    padding: 14px $padding-right-table-data
             $padding-bottom-table-data $padding-left-table-data;

    hr {
      // An <hr> styles the break between two sections of a
      // .panel-simple .panel-body similarly to the space between two rows of a
      // .table. We want the <hr> to stretch across the entire width of the
      // .panel-body, hence the negative left and right margins.
      margin: $padding-bottom-table-data (-$padding-right-table-data)
              $padding-top-table-data (-$padding-left-table-data);
      border-top: $border-top-table-data;
    }
  }
}

.panel-simple-danger {
  @extend .panel-simple;

  .panel-heading {
    border: none;
  }

  .panel-body {
    border: 1px solid $color-danger;
  }
}

.nav-tabs {
  border-bottom: none;

  > li {
    margin-bottom: -1px;
    margin-right: 10px;

    & > a, &.active > a {
      &, &:hover, &:focus {
        background-color: transparent;
        border: none;
        border-bottom: 2px solid transparent;
        border-radius: 0;
        color: $color-text;
        padding: 7px 8px 6px;
      }

      &:hover {
        border-bottom-color: $color-accent-primary;
      }

      &:focus {
        border-bottom-color: $color-action-foreground;
        outline: none;
      }
    }

    &.active > a {
      &, &:hover, &:focus {
        background-color: $color-subpanel-background;
        border-bottom-color: $color-accent-primary;
      }
    }
  }
}

.popover {
  background-color: $color-action-background;
  padding: 0;

  &.left .arrow::after {
    border-left-color: $color-action-background;
  }

  .popover-content {
    padding: 0;
  }
}
</style>
