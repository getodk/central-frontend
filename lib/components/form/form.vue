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
