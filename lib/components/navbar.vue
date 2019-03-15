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
  <nav class="navbar navbar-default">
    <div class="container-fluid">
      <!-- Brand and toggle get grouped for better mobile display -->
      <div class="navbar-header">
        <button type="button" class="navbar-toggle collapsed"
          data-toggle="collapse" data-target="#navbar-collapse"
          aria-expanded="false">
          <span class="sr-only">Toggle navigation</span>
          <span class="navbar-icon-bar"></span>
          <span class="navbar-icon-bar"></span>
          <span class="navbar-icon-bar"></span>
        </button>
        <router-link to="/" class="navbar-brand">ODK Central</router-link>
      </div>

      <div id="navbar-collapse" class="collapse navbar-collapse">
        <ul class="nav navbar-nav">
          <li :class="{ active: $route.path === '/' || routePathStartsWith('/projects') }">
            <router-link id="navbar-projects-link" to="/">
              Projects
              <span v-show="$route.path === '/' || routePathStartsWith('/projects')"
                class="sr-only">
                (current)
              </span>
            </router-link>
          </li>
          <li :class="{ active: routePathStartsWith('/users') }">
            <router-link id="navbar-users-link" to="/users">
              Users
              <span v-show="routePathStartsWith('/users')" class="sr-only">
                (current)
              </span>
            </router-link>
          </li>
          <li :class="{ active: routePathStartsWith('/system/backups') }">
            <router-link id="navbar-system-link" to="/system/backups">
              System
              <span v-show="routePathStartsWith('/system/backups')" class="sr-only">
                (current)
              </span>
            </router-link>
          </li>
        </ul>
        <ul class="nav navbar-nav navbar-right">
          <li v-if="$store.getters.loggedOut">
            <a href="#" @click.prevent>
              <span class="icon-user-circle-o"></span>Not logged in
            </a>
          </li>
          <li v-else class="dropdown">
            <a href="#" class="dropdown-toggle" data-toggle="dropdown"
              role="button" aria-haspopup="true" aria-expanded="false">
              <span class="icon-user-circle-o"></span>{{ currentUser.displayName }}
              <span class="caret"></span>
            </a>
            <ul class="dropdown-menu">
              <li>
                <router-link id="navbar-edit-profile-action" to="/account/edit">
                  Edit profile
                </router-link>
              </li>
              <li>
                <a id="navbar-log-out-action" href="#" @click.prevent="logOut">
                  Log out
                </a>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>

<script>
import { logAxiosError } from '../util/request';
import { requestData } from '../store/modules/request';

export default {
  name: 'Navbar',
  computed: requestData(['session', 'currentUser']),
  methods: {
    routePathStartsWith(path) {
      if (path.endsWith('/') && path !== '/') throw new Error('invalid path');
      return this.$route.path === path ||
        this.$route.path.startsWith(`${path}/`);
    },
    logOut() {
      // Backend ensures that the token is URL-safe.
      this.$http.delete(`/sessions/${this.session.token}`).catch(logAxiosError);
      this.$store.commit('clearData');
      this.$router.push('/login', () => {
        this.$alert().success('You have logged out successfully.');
      });
    }
  }
};
</script>

<style lang="sass">
@import '../../assets/scss/variables';

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
    font-size: 12px;
    font-weight: bold;
    height: auto;
    letter-spacing: -0.02em;
    padding: 5px 15px;

    &, &:hover, &:focus {
      color: #fff;
    }
  }

  .navbar-nav {
    font-size: 12px;
    margin-top: -1 * $border-height;

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

      #navbar-projects-link, #navbar-users-link {
        margin-left: 30px;
      }

      &.navbar-right > li > a {
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

      .active a {
        border-left: $border-height solid #fff;
        padding-left: 15px - $border-height;

        &, &:hover, &:focus {
          background-color: $color-accent-secondary;
          color: #fff;
        }
      }
    }
  }
}
</style>
