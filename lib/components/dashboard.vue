<template>
  <div class="jumbotron">
    <h1>The Adventure Begins</h1>
    <p>
      Inject your data collection with a sense of adventure. Use Super Adventure
      to manage your <a href="https://opendatakit.org/">Open Data Kit</a> forms
      and submissions.
    </p>
    <p>
      <a class="btn btn-primary btn-lg" href="#" role="button"
        @click.prevent="listForms">
        View Your Forms
      </a>
    </p>
  </div>
</template>

<script>
  import ListForms from './form/list.vue';

  export default {
    methods: {
      listForms() {
        this.$emit('view', ListForms);
      }
    }
  }
</script>
