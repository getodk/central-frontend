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
  <div>
    <div id="root-home-heading">
      <h1>Welcome to Central.</h1>
      <p>Let’s get some things done.</p>
    </div>
    <loading :state="fetch.counter < 3 && !fetch.error"/>
    <div v-show="fetch.counter === 3">
      <div class="panel panel-simple">
        <div class="panel-heading"><h1 class="panel-title">You Have:</h1></div>
        <div class="panel-body">
          <div class="row">
            <div class="col-xs-6">
              <root-entity :icons="['user-circle', 'cog']" name="Web User"
                data-from="/users" route-to="/users"
                @fetched="incrementCounter" @error="fetchError">
                who can administer projects through this website.
              </root-entity>
            </div>
            <div class="col-xs-6">
              <root-entity :icons="['user-circle', 'mobile']" name="App User"
                data-from="/field-keys" route-to="/users/field-keys"
                @fetched="incrementCounter" @error="fetchError">
                who can use a data collection client to download and submit form
                data to this server.
              </root-entity>
            </div>
          </div>
          <hr>
          <root-entity :icons="['file-text']" name="Form"
            data-from="/forms" route-to="/forms"
            @fetched="incrementCounter" @error="fetchError">
            which can be downloaded and administered as surveys on mobile
            clients.
          </root-entity>
        </div>
      </div>
      <div class="row">
        <div class="col-xs-6">
          <div class="panel panel-simple">
            <div class="panel-heading">
              <h1 class="panel-title">Getting Started</h1>
            </div>
            <div class="panel-body">
              <p>
                If you’re not sure where to begin, we have a getting started
                guide and user documentation available on the
                <doc-link>Open Data Kit Docs website</doc-link>.
              </p>
              <p>
                In addition, you can always get help from others on the
                <a href="https://forum.opendatakit.org/" target="_blank">Open Data Kit community forum</a>,
                where you can search for previous answers or ask one of your
                own.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import RootEntity from './entity.vue';

export default {
  name: 'RootHome',
  components: { RootEntity },
  data() {
    return {
      fetch: {
        counter: 0,
        error: false
      }
    };
  },
  methods: {
    incrementCounter() {
      this.fetch.counter += 1;
    },
    fetchError() {
      this.fetch.error = true;
    }
  }
};
</script>

<style lang="sass">
#root-home-heading {
  margin-bottom: 20px;
  margin-top: 30px;

  p {
    font-size: 20px;
  }
}
</style>
