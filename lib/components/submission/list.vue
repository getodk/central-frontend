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
            <th>Instance ID</th>
            <th>Submission Time</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <!-- TODO: Add :key. -->
          <tr v-for="(submission, index) in submissions">
            <td>{{ index + 1 }}</td>
            <td>{{ submission.instanceId }}</td>
            <!-- TODO: Format this. -->
            <td>{{ submission.createdAt }}</td>
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

import EditForm from '../form/edit.vue'
import ListForms from '../form/list.vue';

export default {
  props: ['form'],
  data: () => ({
    submissions: null,
    error: null,
  }),
  methods: {
    listForms() {
      this.$emit('view', ListForms);
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
    // TODO: Messaging in case fetch doesn't fail but does take a while.
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
