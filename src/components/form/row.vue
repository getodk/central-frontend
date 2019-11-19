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
  <tr>
    <td>
      <div>
        <router-link :to="formPath" class="form-list-form-name">
          {{ form.nameOrId() }} <span class="icon-angle-right"></span>
        </router-link>
      </div>
      <div v-if="form.name != null" class="form-list-form-id">
        {{ form.xmlFormId }}
      </div>
      <div class="form-list-submissions">
        {{ form.submissions.toLocaleString() }}
        {{ $pluralize('submission', form.submissions) }}
      </div>
    </td>
    <td>{{ form.createdBy != null ? form.createdBy.displayName : '' }}</td>
    <td>{{ updatedOrCreatedAt }}</td>
    <td>{{ lastSubmission }}</td>
  </tr>
</template>

<script>
import Form from '../../presenters/form';
import canRoute from '../../mixins/can-route';
import { formatDate } from '../../util/util';

export default {
  name: 'FormRow',
  mixins: [canRoute()],
  props: {
    form: {
      type: Form,
      required: true
    }
  },
  computed: {
    formPath() {
      const base = `/projects/${this.form.projectId}/forms/${this.form.encodedId()}`;
      // Project Viewers can't navigate to FormOverview, but everyone should be
      // able to navigate to SubmissionList.
      return this.canRoute(base) ? base : `${base}/submissions`;
    },
    updatedOrCreatedAt() {
      return formatDate(this.form.updatedOrCreatedAt());
    },
    lastSubmission() {
      return formatDate(this.form.lastSubmission);
    }
  }
};
</script>
