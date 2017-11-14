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
    <error-message :message="error"/>
    <form-form :initial-xml="form.xml" @submit-record="update">
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
  props: {
    form: {
      type: Object,
      required: true
    }
  },
  data: () => ({
    error: null
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
      { title: `Edit ${this.form.xmlFormId}` }
    ]);
  },
  components: { FormForm }
};
</script>
