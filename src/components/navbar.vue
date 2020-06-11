<!--
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <nav class="navbar navbar-default">
    <div class="container-fluid">
      <div class="navbar-header">
        <button type="button" class="navbar-toggle collapsed"
          data-toggle="collapse" data-target="#navbar-collapse"
          aria-expanded="false">
          <span class="sr-only">{{ $t('toggle') }}</span>
          <span class="navbar-icon-bar"></span>
          <span class="navbar-icon-bar"></span>
          <span class="navbar-icon-bar"></span>
        </button>
        <router-link to="/" class="navbar-brand">{{ $t('brand') }}</router-link>
      </div>
      <div id="navbar-collapse" class="collapse navbar-collapse">
        <navbar-links v-if="currentUser != null"/>
        <ul class="nav navbar-nav navbar-right">
          <navbar-locale-dropdown/>
          <navbar-actions/>
        </ul>
      </div>
    </div>
  </nav>
</template>

<script>
import NavbarActions from './navbar/actions.vue';
import NavbarLinks from './navbar/links.vue';
import NavbarLocaleDropdown from './navbar/locale-dropdown.vue';
import { requestData } from '../store/modules/request';

export default {
  name: 'Navbar',
  components: { NavbarActions, NavbarLinks, NavbarLocaleDropdown },
  // The component does not assume that this data will exist when the component
  // is created.
  computed: requestData(['currentUser'])
};
</script>

<style lang="scss">
@import '../assets/scss/variables';

$active-background-color: #b40066;
$border-height: 3px;
$shadow-color: #dedede;

.navbar-default {
  background-color: $color-accent-primary;
  border: none;
  border-top: $border-height solid $color-accent-secondary;
  box-shadow: 0 $border-height 0 $shadow-color;
  height: 30px + $border-height; // the way bootstrap is set up, the border eats the body.
  margin-bottom: 0;
  min-height: auto;

  .navbar-brand {
    font-size: $font-size-button;
    font-weight: bold;
    height: auto;
    letter-spacing: -0.02em;
    padding: 5px 15px;

    &, &:hover, &:focus {
      color: #fff;
    }
  }

  .navbar-nav {
    font-size: $font-size-button;

    > li > a {
      &, &:hover, &:focus {
        color: #fff;
      }
    }
  }

  // Navbar is not collapsed.
  @media (min-width: 768px) {
    & {
      border-radius: 0;
    }

    .navbar-nav {
      margin-top: -1 * $border-height;

      > li > a {
        border-top: transparent solid $border-height;
        margin-right: 10px;
        padding: 5px 10px;
        transition: 0.25s border-top-color;

        &:hover {
          border-top-color: transparentize(#fff, 0.3);
          transition-duration: 0s;
        }

        &:focus {
          border-top-color: transparentize(#fff, 0.15);
          box-shadow: 0 3px 0 transparentize(#000, 0.9);
          outline: none;
          transition-duration: 0s;
        }
      }

      .active > a, .open > a {
        box-shadow: 0 0 6px transparentize($color-accent-secondary, 0.7) inset;

        &, &:hover, &:focus {
          background-color: $active-background-color;
          border-top-color: #fff;
          color: #fff;
        }
      }

      &.navbar-right > li:last-child > a {
        margin-right: -10px;
      }
    }
  }

  // Navbar is collapsed.
  @media (max-width: 767px) {
    .navbar-toggle {
      border: none;
      margin: -2px 5px;

      &:hover, &:focus {
        background-color: inherit;
      }

      .navbar-icon-bar {
        background-color: #fff;
      }
    }

    .navbar-collapse {
      background-color: $color-accent-secondary;
      border: none;
      position: relative;
      z-index: 99;
    }

    .navbar-nav {
      margin-top: 0;

      .active > a, .open > a {
        border-left: $border-height solid #fff;
        padding-left: 15px - $border-height;

        &, &:hover, &:focus {
          background-color: $color-accent-secondary;
          color: #fff;
        }
      }

      .open .dropdown-menu > li > a {
        &, &:hover, &:focus {
          color: #fff;
        }
      }
    }
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    "toggle": "Toggle navigation",
    "brand": "ODK Central"
  }
}
</i18n>
