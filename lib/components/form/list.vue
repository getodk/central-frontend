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
    <list-heading title="Forms">
      <button type="button" class="btn btn-success" @click="newForm">
        New Form
      </button>
    </list-heading>
    <error-message :message="error"/>
    <!-- Render this element once the forms have been fetched. -->
    <template v-if="forms">
      <p v-if="forms.length === 0">To get started, add a form.</p>
      <table v-else class="table table-hover">
        <thead>
          <tr>
            <th>Form ID</th>
            <th>Last Update</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(form, index) in forms">
            <td>{{ form.xmlFormId }}</td>
            <td>{{ lastUpdate(form) }}</td>
            <td>
              <a href="#" @click.prevent="listSubmissions(form)">Submissions</a> |
              <a href="#" @click.prevent="editForm(form)">Edit</a> |
              <a href="#" @click.prevent="deleteForm(index)">Delete</a>
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

import EditForm from './edit.vue';
import ListSubmissions from '../submission/list.vue';
import NewForm from './new.vue';

export default {
  data: () => ({
    forms: null,
    error: null,
  }),
  methods: {
    newForm() {
      this.$emit('view', NewForm);
    },
    lastUpdate(form) {
      const lastUpdate = form.updatedAt != null ? form.updatedAt : form.createdAt;
      return moment.utc(lastUpdate).fromNow();
    },
    listSubmissions(form) {
      this.$emit('view', ListSubmissions, { form: form });
    },
    editForm(form) {
      this.$emit('view', EditForm, { form: form });
    },
    deleteForm(index) {
      alert("The API doesn't have an endpoint for this yet.");
      //this.forms.splice(index, 1);
    }
  },
  created: function() {
    this.$emit('breadcrumbs', [{ title: 'Forms' }]);
    axios
      .get('/forms')
      .then(response => this.forms = response.data)
      .catch(error => {
        console.error(error);
        this.error = 'Something went wrong while loading your forms.';
      });
  }
};
</script>
