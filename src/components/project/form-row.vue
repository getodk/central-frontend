<!--
Copyright 2022 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <tr class="project-form-row">
    <!--todo: come back and figure out all the permissions-->
    <td class="name">
      <link-if-can :to="primaryFormPath(form)">
        {{ form.nameOrId() }}
      </link-if-can>
    </td>
    <td class="review-state">
      {{ $n(form.reviewStates.received) }}<span class="icon-dot-circle-o"></span>
    </td>
    <td class="review-state">
      {{ $n(form.reviewStates.hasIssues) }}<span class="icon-comments"></span>
    </td>
    <td class="review-state">
      {{ $n(form.reviewStates.edited) }}<span class="icon-pencil"></span>
    </td>
    <td class="last-submission">
      <div v-if="form.lastSubmission != null">
        <router-link :to="submissionsPath">
          <date-time :iso="form.lastSubmission" relative="past"/>
          <span class="icon-clock-o"></span>
        </router-link>
      </div>
    </td>
    <td class="total-submissions">
      <div v-if="form.publishedAt != null">
        <router-link :to="submissionsPath">
          <span>{{ $n(form.submissions) }}</span>
          <span class="icon-gear"></span>
        </router-link>
      </div>
    </td>
  </tr>
</template>

<script>
import DateTime from '../date-time.vue';
import LinkIfCan from '../link-if-can.vue';
import Form from '../../presenters/form';
import routes from '../../mixins/routes';
import { requestData } from '../../store/modules/request';

export default {
  name: 'ProjectFormRow',
  components: { DateTime, LinkIfCan },
  mixins: [routes()],
  props: {
    form: {
      type: Form,
      required: true
    },
    columns: {
      type: Set,
      required: true
    }
  },
  computed: {
    // The component assumes that this data will exist when the component is
    // created.
    ...requestData(['project']),
    submissionsPath() {
      return this.formPath(
        this.form.projectId,
        this.form.xmlFormId,
        this.form.publishedAt != null ? 'submissions' : 'draft/testing'
      );
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/mixins';

.project-form-row {
  .table tbody & td { vertical-align: middle; }

  td {
    font-size: 18px;
    color: #333;
    a { @include text-link; }
  }

  .review-state, .total-submissions {
    text-align: right;
    width: 100px;
  }

  .last-submission{
    text-align: right;
    width: 150px;
  }

  [class*='icon'] {
    margin-left: 5px;
    color: #666;
  }
}
</style>
