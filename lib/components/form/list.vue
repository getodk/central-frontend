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
    <loading :state="awaitingResponse"/>
    <template v-if="forms != null">
      <p v-if="forms.length === 0" id="form-list-message">
        To get started, add a form.
      </p>
      <table v-else id="form-list-table" class="table">
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
              {{ lastModified(form) }}
            </td>
            <td>
              {{ lastSubmission(form) }}
            </td>
          </tr>
        </tbody>
      </table>
    </template>
  </div>
</template>

<script>
import request from '../../mixins/request';
import { formatDate } from '../../util';

export default {
  name: 'FormList',
  mixins: [request()],
  data() {
    return {
      requestId: null,
      forms: null
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
    lastModified(form) {
      return formatDate(form.updatedAt != null ? form.updatedAt : form.createdAt);
    },
    lastSubmission(form) {
      return formatDate(form.lastSubmission);
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
        margin-right: 0;
        vertical-align: 2px;
      }
    }

    .form-list-form-id {
      font-size: 18px;
    }
  }
}
</style>
