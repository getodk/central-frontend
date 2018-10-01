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
    <navbar v-show="firstNavigationConfirmed"/>
    <alert id="app-alert" v-bind="alert" @close="alert.state = false"/>
    <div class="container-fluid">
      <router-view/>
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
      initialized to true and the $route() watcher will not be called until the
      user navigates elsewhere. However, if the initial navigation is
      asynchronous, Vue seems to create App before waiting to confirm the
      navigation. In that case, firstNavigationConfirmed will be initialized to
      false and the $route() watcher will be called once the initial navigation
      is confirmed. */
      firstNavigationConfirmed: routerState.navigations.first.confirmed,
      alert: blankAlert()
    };
  },
  computed: {
    routeAndAlert() {
      return [this.$route, this.alert];
    }
  },
  watch: {
    // Using a strategy similar to the one here:
    // https://github.com/vuejs/vue/issues/844
    routeAndAlert([currentRoute, currentAlert], [previousRoute, previousAlert]) {
      if (currentRoute === previousRoute) return;
      this.firstNavigationConfirmed = true;
      if (currentAlert === previousAlert && this.alert.state)
        this.alert.state = false;
    }
  },
  mounted() {
    // The `disabled` class on an <a> element does not prevent keyboard
    // navigation.
    $(this.$refs.app).on('click', 'a.disabled', (event) => {
      event.preventDefault();
    });
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
  color: #333;
  min-height: 100vh;
}

h1 {
  font-size: 30px;
  font-weight: bold;
  letter-spacing: -0.02em;
  margin-bottom: 3px;
}

.text-muted {
  color: #999;
}

.text-success {
  color: $color-success;

  a {
    &:hover, &:focus {
      color: $color-success-dark;
    }
  }
}

.text-danger {
  color: $color-danger;

  a {
    &:hover, &:focus {
      color: $color-danger-dark;
    }
  }
}

.text-monospace {
  font-family: Menlo, Monaco, Consolas, "Courier New", monospace;
}

.text-no-decoration {
  &, &:hover, &:focus, &.focus {
    text-decoration: none;
  }
}

a:hover, a:focus {
  .underline-within-link {
    text-decoration: underline;
  }
}

@media print {
  a.text-no-decoration:visited {
    text-decoration: none;
  }

  .underline-within-link {
    text-decoration: underline;
  }
}

[class^="icon-"], [class*=" icon-"] {
  vertical-align: -1px;
}

.btn {
  border: none;
  border-radius: 2px;
  font-size: 12px;
  overflow: hidden;
  padding: 6px 10px 5px;
  position: relative;
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

  input, select {
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
      transform: translateY(-13px);
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
    padding: $padding-top-table-data $padding-right-table-data
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
