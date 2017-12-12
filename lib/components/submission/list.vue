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
    <breadcrumbs :list="breadcrumbs"/>
    <heading title="Submissions">
      <router-link to="/forms" class="btn btn-default" role="button">
        Back to Forms
      </router-link>
    </heading>
    <alert type="danger" :message="error"/>
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
            <th>Submission Date</th>
            <th>Instance ID</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(submission, index) in submissions">
            <td>{{ index + 1 }}</td>
            <td>{{ submissionDate(submission) }}</td>
            <td>{{ submission.instanceId }}</td>
            <td>
              <a href="#" @click.prevent="deleteSubmission(index)">Delete</a>
            </td>
          </tr>
        </tbody>
      </table>
    </template>
  </div>
</template>

<script>
import axios from 'axios';
import moment from 'moment';

export default {
  data() {
    return {
      error: null,
      loading: false,
      submissions: null
    };
  },
  computed: {
    xmlFormId() {
      return this.$route.params.xmlFormId;
    },
    breadcrumbs() {
      return [
        { title: 'Forms', to: '/forms' },
        { title: this.xmlFormId },
        { title: 'Submissions' }
      ];
    }
  },
  created() {
    this.fetchData();
  },
  watch: {
    $route() {
      this.error = null;
      this.fetchData();
    }
  },
  methods: {
    fetchData() {
      this.submissions = null;
      this.loading = true;
      axios
        .get(`/forms/${this.xmlFormId}/submissions`)
        .then(response => {
          this.submissions = response.data;
          this.loading = false;
        })
        .catch(error => {
          console.error(error.response.data);
          this.error = error.response.data.message;
          this.loading = false;
        });
    },
    submissionDate(submission) {
      return moment.utc(submission.createdAt).format('MMM D, Y H:mm:ss UTC');
    },
    deleteSubmission(index) { // eslint-disable-line no-unused-vars
      // eslint-disable-next-line no-alert
      alert("The API doesn't have an endpoint for this yet.");
      // this.submissions.splice(index, 1);
    }
  }
};
</script>
