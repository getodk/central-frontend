<!-- Component for an HTML form to create/update an ODK form -->
<template>
  <form @submit.prevent="$emit('submit-record', xml)">
    <div class="form-group">
      <label for="form-xml">Form XML</label>
      <textarea v-model="xml" class="form-control" required rows="10"></textarea>
    </div>
    <slot></slot>
  </form>
</template>

<script>
export default {
  props: ['initialXml'],
  data: function() {
    return {
      xml: this.initialXml != null ? this.initialXml : ''
    };
  }
};
</script>
