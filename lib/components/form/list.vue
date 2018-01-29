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
      <template slot="body">
        You collect data by <doc-link>designing a form</doc-link> on your
        computer, and then <doc-link>loading that form onto a mobile
        device</doc-link> to administer.
      </template>
    </page-head>
    <page-body>
      <alert v-bind="alert" @close="alert.state = false"/>
      <float-row>
        <button type="button" class="btn btn-primary"
          @click="newForm.state = true">
          <span class="icon-plus-circle"></span> Create a New Form
        </button>
      </float-row>
      <loading :state="awaitingResponse"/>
      <!-- Render this element once the forms have been fetched. -->
      <template v-if="forms">
        <p v-if="forms.length === 0">To get started, add a form.</p>
        <table v-else id="form-list-table" class="table table-hover">
          <thead>
            <tr>
              <th>Form ID</th>
              <th>Last Modified</th>
              <th>Last Submission</th>
            </tr>
          </thead>
          <tbody>
            <router-link v-for="form of forms" :key="form.xmlFormId"
              :to="`/forms/${form.xmlFormId}`" tag="tr"
              :class="highlight(form, 'xmlFormId')">
              <td>
                <div>{{ form.xmlFormId }}</div>
                <!-- TODO: Not yet implemented. -->
                <div>??? submissions</div>
              </td>
              <td>
                {{ updatedAt(form) }}
              </td>
              <!-- TODO: Not yet implemented. -->
              <td>
                ???
              </td>
            </router-link>
          </tbody>
        </table>
      </template>
      <form-new v-bind="newForm" @hide="newForm.state = false"
        @create="afterCreate"/>
    </page-body>
  </div>
</template>

<script>
import moment from 'moment';

import FormNew from './new.vue';
import alert from '../../mixins/alert';
import highlight from '../../mixins/highlight';
import request from '../../mixins/request';

export default {
  name: 'FormList',
  components: { FormNew },
  mixins: [alert({ login: true }), request(), highlight()],
  data() {
    return {
      alert: alert.blank(),
      requestId: null,
      forms: null,
      highlighted: null,
      newForm: {
        state: false
      }
    };
  },
  created() {
    this.fetchData();
  },
  methods: {
    fetchData() {
      this.forms = null;
      this
        .get('/forms')
        .then(forms => {
          this.forms = forms;
        })
        .catch(() => {});
    },
    updatedAt(form) {
      const updatedAt = form.updatedAt != null ? form.updatedAt : form.createdAt;
      return moment.utc(updatedAt).fromNow();
    },
    afterCreate(form) {
      this.fetchData();
      this.alert = alert.success(`Form ${form.xmlFormId} was created successfully.`);
      this.highlighted = form.xmlFormId;
    }
  }
};
</script>

<style lang="sass">
#form-list-table {
  & > thead > tr > th:nth-child(n+2),
  & > tbody > tr > td:nth-child(n+2) {
    width: 200px;
  }

  & > tbody {
    cursor: pointer;

    & > tr > td {
      vertical-align: middle;

      &:first-child > div:first-child {
        font-size: 30px;
      }
    }
  }
}
</style>
