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
    <list-heading title="Submissions">
      <button type="button" class="btn btn-default" @click="listForms">
        Back to Forms
      </button>
    </list-heading>
    <error-message :message="error"/>
    <!-- Render this element once the submissions have been fetched. -->
    <template v-if="submissions">
      <p v-if="submissions.length === 0">
        There are no submissions yet for <em>{{ form.xmlFormId }}</em>.
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

import ListForms from '../form/list.vue';

export default {
  props: {
    form: {
      type: Object,
      required: true
    }
  },
  data: () => ({
    submissions: null,
    error: null,
  }),
  methods: {
    listForms() {
      this.$emit('view', ListForms);
    },
    submissionDate(submission) {
      return moment.utc(submission.createdAt).format('MMM D, Y H:mm:ss UTC');
    },
    deleteSubmission(index) {
      alert("The API doesn't have an endpoint for this yet.");
      //this.submissions.splice(index, 1);
    }
  },
  created: function() {
    this.$emit('breadcrumbs', [
      { title: 'Forms', view: ListForms },
      { title: this.form.xmlFormId },
      { title: 'Submissions' }
    ]);
    axios
      .get(`/forms/${this.form.xmlFormId}/submissions`)
      .then(response => this.submissions = response.data)
      .catch(error => {
        console.error(error);
        this.error = 'Something went wrong while loading the form’s submissions.';
      });
  }
};
</script>
