<template>
  <div>
    <error-message :message="error"/>
    <form-form @submit-record="create">
      <button type="submit" class="btn btn-success">Create Form</button>
      <!-- Using <a> rather than <button> so that clicking does not trigger a
      submit. -->
      <a href="#" class="btn btn-default" role="button" @click.prevent="listForms">
        Back to Forms
      </a>
    </form-form>
  </div>
</template>

<script>
import axios from 'axios';

import FormForm from './form.vue';
import ListForms from './list.vue';

export default {
  data: () => ({
    error: null
  }),
  methods: {
    create(data) {
      axios
        .post('/forms', data)
        .then(() => this.$emit('view', ListForms))
        .catch(error => {
          // TODO: Blur the create button.
          console.error(error);
          this.error = 'Something went wrong while creating the form.';
        });
    },
    listForms() {
      this.$emit('view', ListForms);
    }
  },
  created: function() {
    this.$emit('breadcrumbs', [
      { title: 'Forms', view: ListForms },
      { title: 'New Form' }
    ]);
    // TODO: Focus the form XML field?
  },
  components: {
    'form-form': FormForm
  }
};
</script>
