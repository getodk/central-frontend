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
    <page-head>
      <template slot="title">{{ xmlFormId }}</template>
      <template slot="tabs">
        <li role="presentation">
          <a href="#overview" aria-controls="overview" role="tab"
            data-toggle="tab">
            Overview
          </a>
        </li>
        <li role="presentation" class="active">
          <a href="#submissions" aria-controls="submissions" role="tab"
            data-toggle="tab">
            Submissions
          </a>
        </li>
        <li role="presentation">
          <a href="#settings" aria-controls="settings" role="tab"
            data-toggle="tab">
            Settings
          </a>
        </li>
      </template>
    </page-head>
    <page-body>
      <div class="tab-content">
        <div id="overview" class="tab-pane" role="tabpanel">
          Not yet implemented.
        </div>
        <div id="submissions" class="tab-pane active" role="tabpanel">
          <alerts :list="alerts" @dismiss="dismissAlert"/>
          <loading :state="loading"/>
          <!-- Render this element once the submissions have been fetched. -->
          <template v-if="submissions">
            <p v-if="submissions.length === 0">
              There are no submissions yet for <em>{{ xmlFormId }}</em>.
            </p>
            <table v-else class="table table-hover">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Instance ID</th>
                  <th>Reviewed</th>
                  <th>Submitted by</th>
                  <th>Submitted at</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(submission, index) in submissions"
                  :key="submission.id">
                  <td>{{ index + 1 }}</td>
                  <td>{{ submission.instanceId }}</td>
                  <!-- TODO: Not yet implemented. -->
                  <td>???</td>
                  <!-- TODO: Not yet implemented. -->
                  <td>???</td>
                  <td>{{ createdAt(submission) }}</td>
                </tr>
              </tbody>
            </table>
          </template>
        </div>
        <div id="settings" class="tab-pane" role="tabpanel">
          Not yet implemented.
        </div>
      </div>
    </page-body>
  </div>
</template>

<script>
import moment from 'moment';

import alert from '../../mixins/alert';
import request from '../../mixins/request';

export default {
  mixins: [alert, request],
  data() {
    return {
      alerts: [],
      loading: false,
      submissions: null
    };
  },
  computed: {
    xmlFormId() {
      return this.$route.params.xmlFormId;
    }
  },
  created() {
    this.fetchData();
  },
  watch: {
    $route() {
      this.fetchData();
      this.alerts = [];
    }
  },
  methods: {
    fetchData() {
      this.submissions = null;
      this
        .get(`/forms/${this.xmlFormId}/submissions`)
        .then(response => {
          // Add a unique ID to each submission so that we can use the ID as the
          // v-for key.
          const submissions = [];
          for (const submission of response.data) {
            const id = { id: this.$uniqueId() };
            const submissionWithId = Object.assign(id, submission);
            submissions.push(submissionWithId);
          }
          this.submissions = submissions;
        })
        .catch(error => console.error(error));
    },
    createdAt(submission) {
      return moment.utc(submission.createdAt).format('MMM D, Y H:mm:ss UTC');
    }
  }
};
</script>
