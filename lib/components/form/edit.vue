<template>
  <div>
    <error-message :message="error"/>
    <form-form :initialXml="xml" @submit-record="update">
      <button type="submit" class="btn btn-info">Save</button>
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
  props: ['xmlFormId', 'xml'],
  data: () => ({
    error: null,
  }),
  methods: {
    update(data) {
      alert("The API doesn't have an endpoint for this yet.");
    },
    listForms() {
      this.$emit('view', ListForms);
    }
  },
  created: function() {
    this.$emit('breadcrumbs', [
      { title: 'Forms', view: ListForms },
      { title: `Edit ${this.xmlFormId}` }
    ]);
  },
  components: {
    'form-form': FormForm
  }
};
</script>

<style scoped>
h1 {
  margin-bottom: 18px;
}
</style>
