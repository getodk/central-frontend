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
          <span class="icon-bar"></span>
          <span class="icon-bar"></span>
          <span class="icon-bar"></span>
        </button>
        <router-link to="/" class="navbar-brand">ODK Central</router-link>
      </div>

      <!-- Collect the nav links, forms, and other content for toggling -->
      <div id="navbar-collapse" class="collapse navbar-collapse">
        <ul class="nav navbar-nav">
          <li v-for="(link, index) in links" :key="index"
            :class="{ active: link.active }">
            <router-link :to="link.to" :id="link.id">
              {{ link.text }}
              <span v-show="link.active" class="sr-only">(current)</span>
            </router-link>
          </li>
        </ul>
        <ul class="nav navbar-nav navbar-right">
          <li v-if="session.loggedOut()">
            <a href="#" @click.prevent>
              <span class="icon-user-circle-o"></span> Not logged in
            </a>
          </li>
          <li v-else class="dropdown">
            <a href="#" class="dropdown-toggle" data-toggle="dropdown"
              role="button" aria-haspopup="true" aria-expanded="false">
              <span class="icon-user-circle-o"></span> {{ session.user.displayName }}
              <span class="caret"></span>
            </a>
            <ul class="dropdown-menu">
              <li>
                <a id="navbar-edit-profile-action" href="#"
                  @click.prevent="editProfile">
                  Edit Profile
                </a>
              </li>
              <li>
                <a id="navbar-log-out-action" href="#" @click.prevent="logOut">
                  Log out
                </a>
              </li>
            </ul>
          </li>
        </ul>
      </div><!-- /.navbar-collapse -->
    </div><!-- /.container-fluid -->
  </nav>
</template>

<script>
import { logOut } from '../session';
import { logRequestError } from '../util';

const DEFAULT_ACTIVE_PATH = '/';

class Link {
  constructor(component, text, to, id) {
    this.component = component;
    this.text = text;
    this.to = to;
    this.id = id;
  }

  _activePath() {
    const routePath = this.component.$route.path;
    switch (routePath) {
      case '/login':
      case '/reset-password':
        return this.component.$route.query.next || DEFAULT_ACTIVE_PATH;
      case '/account/claim':
        return DEFAULT_ACTIVE_PATH;
      default:
        return routePath;
    }
  }

  get active() {
    const activePath = this._activePath();
    return this.to === activePath || activePath.startsWith(`${this.to}/`);
  }
}

export default {
  name: 'Navbar',
  props: {
    session: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      links: [
        new Link(this, 'Forms', '/forms', 'navbar-forms-link'),
        new Link(this, 'Users', '/users', 'navbar-users-link'),
        new Link(this, 'System', '/system/backups', 'navbar-system-link')
      ]
    };
  },
  watch: {
    $route() {
      this.loggedIn = this.$session.loggedIn();
    }
  },
  methods: {
    editProfile() {
      this.$router.push('/account/edit');
    },
    deleteSession() {
      const encodedToken = encodeURIComponent(this.$session.token);
      // Using $http directly rather than the request mixin, because multiple
      // pending DELETE requests are possible and unproblematic.
      this.$http.delete(`/sessions/${encodedToken}`).catch(logRequestError);
    },
    routeToLogin() {
      const query = Object.assign({}, this.$route.query);
      query.next = this.$route.path;
      this.$router.push({ path: '/login', query }, () => {
        this.$alert().success('You have logged out successfully.');
      });
    },
    logOut() {
      this.deleteSession();
      logOut();
      this.routeToLogin();
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
        transition: 0.15s border-top-color;

        &:hover {
          border-top-color: transparentize(#fff, 0.3);
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

      #navbar-forms-link, #navbar-users-link {
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
      .icon-bar {
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
