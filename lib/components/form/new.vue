<template>
  <div>
    <error-message :message="error"/>
    <form-form focus @submit-record="create">
      <button type="submit" class="btn btn-success" :disabled="disabled">
        Create Form
      </button>
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
    disabled: false,
    error: null
  }),
  methods: {
    create(data) {
      this.disabled = true;
      axios
        .post('/forms', data)
        .then(() => this.$emit('view', ListForms))
        .catch(error => {
          console.error(error);
          this.error = 'Something went wrong while creating the form.';
          this.disabled = false;
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
  },
  components: { FormForm }
};
</script>
