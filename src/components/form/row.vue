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
  <tr class="form-row">
    <td>
      <div>
        <router-link :to="permittedFormPath" class="form-row-name">
          {{ form.nameOrId() }} <span class="icon-angle-right"></span>
        </router-link>
      </div>
      <div v-if="form.name != null" class="form-row-form-id">
        {{ form.xmlFormId }}
      </div>
      <div class="form-row-submissions">
        {{ $pluralize('submission', form.submissions, true) }}
      </div>
    </td>
    <td>{{ form.createdBy != null ? form.createdBy.displayName : '' }}</td>
    <td>{{ updatedOrCreatedAt }}</td>
    <td>{{ lastSubmission }}</td>
  </tr>
</template>

<script>
import Form from '../../presenters/form';
import routes from '../../mixins/routes';
import { formatDate } from '../../util/date-time';

export default {
  name: 'FormRow',
  mixins: [routes()],
  props: {
    form: {
      type: Form,
      required: true
    }
  },
  computed: {
    permittedFormPath() {
      const path = this.formPath(this.form.projectId, this.form.xmlFormId);
      // Project Viewers can't navigate to FormOverview, but everyone should be
      // able to navigate to SubmissionList.
      return this.canRoute(path) ? path : `${path}/submissions`;
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

<style lang="scss">
@import '../../assets/scss/variables';

.form-row td {
  vertical-align: middle;
}

.form-row-name {
  font-size: 30px;

  &, &:hover, &:focus {
    color: inherit;
    text-decoration: none;
  }

  .icon-angle-right {
    color: $color-accent-primary;
    font-size: 20px;
    margin-left: 3px;
    margin-right: 0;
    vertical-align: 2px;
  }
}

.form-row-form-id {
  font-size: 18px;
}
</style>
