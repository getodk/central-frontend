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
    <td class="form-name">
      <template v-if="canLinkToFormOverview">
        <router-link :to="primaryFormPath(form)">{{ form.nameOrId() }}</router-link>
      </template>
      <template v-else-if="canLinkToSubmissions">
        <router-link :to="submissionsPath.all">{{ form.nameOrId() }}</router-link>
      </template>
      <template v-else>
        <template v-if="canLinkToEnketo">
          <a :href="enketoPath" target="_blank">{{ form.nameOrId() }}</a>
        </template>
        <template v-else>
          {{ form.nameOrId() }}
        </template>
      </template>
    </td>
    <template v-if="form.publishedAt != null">
      <td v-for="reviewState of visibleReviewStates" :key="reviewState" class="review-state">
        <template v-if="canLinkToSubmissions">
          <router-link :to="submissionsPath[reviewState]">
            <span>{{ $n(form.reviewStates[reviewState], 'default') }}</span>
            <span :class="reviewStateIcon(reviewState)"></span>
          </router-link>
        </template>
        <template v-else>
          <span>{{ $n(form.reviewStates[reviewState], 'default') }}</span>
          <span :class="reviewStateIcon(reviewState)"></span>
        </template>
      </td>
      <td class="last-submission">
        <template v-if="form.lastSubmission != null">
          <template v-if="canLinkToSubmissions">
            <router-link :to="submissionsPath.all">
              <date-time :iso="form.lastSubmission" relative="past"/>
              <span class="icon-clock-o"></span>
            </router-link>
          </template>
          <template v-else>
            <date-time :iso="form.lastSubmission" relative="past"/>
            <span class="icon-clock-o"></span>
          </template>
        </template>
        <template v-else>{{ $t('submission.noSubmission') }}</template>
      </td>
      <td class="total-submissions">
        <template v-if="canLinkToSubmissions">
          <router-link :to="submissionsPath.all">
            <span>{{ $n(form.submissions, 'default') }}</span>
            <span class="icon-asterisk"></span>
          </router-link>
        </template>
        <template v-else>
          <span>{{ $n(form.submissions, 'default') }}</span>
          <span class="icon-asterisk"></span>
        </template>
      </td>
    </template>
    <template v-else>
      <td class="not-published" colspan="5">
        <span>{{ $t('unpublished') }}</span>
        <span class="icon-asterisk"></span>
      </td>
    </template>
  </tr>
</template>

<script>
import DateTime from '../date-time.vue';
import Form from '../../presenters/form';
import Project from '../../presenters/project';
import routes from '../../mixins/routes';

import useReviewState from '../../composables/review-state';
import { enketoBasePath } from '../../util/util';

export default {
  name: 'ProjectFormRow',
  components: { DateTime },
  mixins: [routes()],
  props: {
    form: {
      type: Form,
      required: true
    },
    project: {
      type: Project,
      required: true
    }
  },
  setup() {
    const { reviewStateIcon } = useReviewState();
    return { reviewStateIcon };
  },
  computed: {
    canLinkToFormOverview() {
      return this.project.permits('form.update');
    },
    canLinkToSubmissions() {
      return this.project.permits('submission.list');
    },
    canLinkToEnketo() {
      return this.form.publishedAt != null && this.form.state === 'open' && this.form.enketoId !== null;
    },
    visibleReviewStates: () => ['received', 'hasIssues', 'edited'],
    submissionsPath() {
      const submissionPath = this.formPath(
        this.form.projectId,
        this.form.xmlFormId,
        'submissions'
      );
      return {
        received: `${submissionPath}?reviewState=null`,
        edited: `${submissionPath}?reviewState=%27edited%27`,
        hasIssues: `${submissionPath}?reviewState=%27hasIssues%27`,
        all: submissionPath
      };
    },
    enketoPath() {
      const encodedId = encodeURIComponent(this.form.enketoId);
      return `${enketoBasePath}/${encodedId}`;
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/mixins';

.project-form-row {
  td {
    font-size: 16px;
    padding: 3px 0px 3px 6px;
    color: #333;
    a { @include text-link; }
  }

  .review-state, .total-submissions, .not-published {
    text-align: right;
    width: 100px;
  }

  .last-submission{
    text-align: right;
    width: 150px;
  }

  [class*='icon'] {
    margin-left: 5px;
    color: #888;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    // This text is shown in the Forms table in place of submission counts
    // when the Form has not been published and there are no submission
    // counts to show.
    "unpublished": "Not published yet"
  }
}
</i18n>
