<!-- Component for an HTML form to create/update an ODK form -->
<template>
  <form @submit.prevent="$emit('submit-record', xml)">
    <div class="form-group">
      <label for="xml">Form XML</label>
      <textarea v-model="xml" ref="xml" id="xml" class="form-control" required rows="10">
      </textarea>
    </div>
    <slot></slot>
  </form>
</template>

<script>
export default {
  props: {
    initialXml: {
      type: String,
      default: ''
    },
    focus: Boolean
  },
  data: function() {
    return {
      xml: this.initialXml
    };
  },
  mounted: function() {
    if (focus) this.$refs.xml.focus();
  }
};
</script>
