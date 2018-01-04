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
        <router-link to="/" class="navbar-brand">Open Data Kit</router-link>
      </div>

      <!-- Collect the nav links, forms, and other content for toggling -->
      <div class="collapse navbar-collapse" id="navbar-collapse">
        <ul class="nav navbar-nav">
          <li v-for="(link, index) in links" :key="index"
            :class="{ active: link.active }">
            <router-link :to="link.to">
              {{ link.text }}
              <span v-show="link.active" class="sr-only">(current)</span>
            </router-link>
          </li>
        </ul>
      </div><!-- /.navbar-collapse -->
    </div><!-- /.container-fluid -->
  </nav>
</template>

<script>
class Link {
  constructor(component, text, to) {
    this.component = component;
    this.text = text;
    this.to = to;
  }

  get active() {
    const { path } = this.component.$route;
    if (path === this.to || path.startsWith(`${this.to}/`)) return true;
    const { next } = this.component.$route.query;
    if (path !== '/login' || next == null) return false;
    return next === this.to || next.startsWith(`${this.to}/`);
  }
}

export default {
  name: 'Navbar',
  data() {
    return {
      links: [
        new Link(this, 'Forms', '/forms'),
        new Link(this, 'Users', '/users')
      ]
    };
  }
};
</script>

<style>
.navbar {
  background-color: #9f3468;
  margin-bottom: 0;
}

.navbar-default .navbar-brand,
.navbar-default .navbar-brand:focus,
.navbar-default .navbar-nav > li > a,
.navbar-default .navbar-nav > li > a:focus,
.navbar-default .navbar-nav > .active > a,
.navbar-default .navbar-nav > .active > a:focus {
  color: white;
}

.navbar-default .navbar-brand:hover,
.navbar-default .navbar-nav > li > a:hover,
.navbar-default .navbar-nav > .active > a:hover {
  color: #e8e8e8;
}

.navbar-default .navbar-nav > .active > a,
.navbar-default .navbar-nav > .active > a:hover,
.navbar-default .navbar-nav > .active > a:focus {
  /* border-top-width and padding-top must sum to 15px. */
  border-top: white solid 2px;
  padding-top: 13px;

  background-color: #973163;
}
</style>
