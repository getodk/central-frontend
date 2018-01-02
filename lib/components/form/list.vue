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
    <page-head>
      <template slot="title">Forms</template>
    </page-head>
    <page-body>
    <router-link to="forms/new" class="btn btn-success" role="button">
      New Form
    </router-link>
    <alerts :list="alerts" @dismiss="dismissAlert"/>
    <loading :state="awaitingResponse"/>
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
          <tr v-for="(form, index) in forms" :class="highlight(form, 'xmlFormId')">
            <td>{{ form.xmlFormId }}</td>
            <td>{{ lastUpdate(form) }}</td>
            <td>
              <router-link :to="listSubmissions(form)">Submissions</router-link> |
              <router-link :to="editForm(form)">Edit</router-link> |
              <a href="#" @click.prevent="deleteForm(index)">Delete</a>
            </td>
          </tr>
        </tbody>
      </table>
    </template>
    </page-body>
  </div>
</template>

<script>
import moment from 'moment';

import alert from '../../mixins/alert';
import highlight from '../../mixins/highlight';
import request from '../../mixins/request';

export default {
  mixins: [alert, request, highlight],
  data() {
    return {
      alerts: [],
      awaitingResponse: false,
      forms: null
    };
  },
  computed: {
    highlighted() {
      return this.$route.query.newForm;
    }
  },
  created() {
    this
      .get('/forms')
      .then(response => {
        this.forms = response.data;
      })
      .catch(error => console.error(error));
  },
  methods: {
    lastUpdate(form) {
      const lastUpdate = form.updatedAt != null ? form.updatedAt : form.createdAt;
      return moment.utc(lastUpdate).fromNow();
    },
    listSubmissions(form) {
      return `forms/${form.xmlFormId}/submissions`;
    },
    editForm(form) {
      return `forms/${form.xmlFormId}/edit`;
    },
    deleteForm(index) { // eslint-disable-line no-unused-vars
      // eslint-disable-next-line no-alert
      alert("The API doesn't have an endpoint for this yet.");
      // this.forms.splice(index, 1);
    }
  }
};
</script>
