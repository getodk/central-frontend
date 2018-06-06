<!--
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/opendatakit/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div>
    <page-head>
      <template slot="title">Forms</template>
      <template slot="body">
        You collect data by
        <doc-link to="form-design-intro/">designing a form</doc-link> on your
        computer, and then
        <doc-link to="collect-forms/#loading-blank-forms">loading that form onto
        a mobile device</doc-link> to administer.
      </template>
    </page-head>
    <page-body>
      <alert v-bind="alert" @close="alert.state = false"/>
      <float-row class="table-actions">
        <refresh-button slot="left" :fetching="awaitingResponse"
          @refresh="fetchData({ clear: false })"/>
        <button id="form-list-new-button" slot="right" type="button"
          class="btn btn-primary" @click="newForm.state = true">
          <span class="icon-plus-circle"></span> Create a new form
        </button>
      </float-row>
      <loading v-if="forms == null" :state="awaitingResponse"/>
      <p v-else-if="forms.length === 0">To get started, add a form.</p>
      <table v-else id="form-list-table" class="table table-hover">
        <thead>
          <tr>
            <th>Name</th>
            <th>Created by</th>
            <th>Last Modified</th>
            <th>Last Submission</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="form of forms" :key="form.xmlFormId">
            <td>
              <div>
                <router-link :to="`/forms/${form.xmlFormId}`"
                  class="form-list-form-name">
                  {{ form.name || form.xmlFormId }}
                  <span class="icon-angle-right"></span>
                </router-link>
              </div>
              <div v-if="form.name != null" class="form-list-form-id">
                {{ form.xmlFormId }}
              </div>
              <div class="form-list-submissions">{{ submissions(form) }}</div>
            </td>
            <td>
              {{ form.createdBy != null ? form.createdBy.displayName : '' }}
            </td>
            <td>
              {{ updatedAt(form) }}
            </td>
            <td>
              {{ lastSubmission(form) }}
            </td>
          </tr>
        </tbody>
      </table>

      <form-new v-bind="newForm" @hide="newForm.state = false"/>
    </page-body>
  </div>
</template>

<script>
import moment from 'moment';

import FormNew from './new.vue';
import alert from '../../mixins/alert';
import modal from '../../mixins/modal';
import request from '../../mixins/request';

export default {
  name: 'FormList',
  components: { FormNew },
  mixins: [alert(), request(), modal('newForm')],
  data() {
    return {
      alert: alert.blank(),
      requestId: null,
      forms: null,
      newForm: {
        state: false
      }
    };
  },
  created() {
    this.fetchData({ clear: false });
  },
  methods: {
    fetchData({ clear }) {
      if (clear) this.forms = null;
      const headers = { 'X-Extended-Metadata': 'true' };
      this
        .get('/forms', { headers })
        .then(({ data }) => {
          this.forms = data;
        })
        .catch(() => {});
    },
    submissions(form) {
      const count = form.submissions.toLocaleString();
      const s = form.submissions !== 1 ? 's' : '';
      return `${count} submission${s}`;
    },
    updatedAt(form) {
      const updatedAt = form.updatedAt != null ? form.updatedAt : form.createdAt;
      return moment(updatedAt).fromNow();
    },
    lastSubmission(form) {
      const { lastSubmission } = form;
      return lastSubmission != null ? moment(lastSubmission).fromNow() : '';
    }
  }
};
</script>

<style lang="sass">
@import '../../../assets/scss/variables';

#form-list-table {
  tbody td {
    vertical-align: middle;

    .form-list-form-name {
      color: unset;
      font-size: 30px;
      text-decoration: unset;

      .icon-angle-right {
        color: $color-accent-primary;
        font-size: 20px;
        margin-left: 3px;
        vertical-align: 2px;
      }
    }

    .form-list-form-id {
      font-size: 18px;
    }
  }
}
</style>
