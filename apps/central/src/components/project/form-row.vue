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
      <template v-if="canLinkToDraftStatus">
        <form-link :form="form"/>
      </template>
      <template v-else-if="canLinkToSubmissions">
        <form-link :form="form" :to="submissionsPath.all"/>
      </template>
      <template v-else>
        <template v-if="canLinkToEnketo">
          <a :href="enketoPath" target="_blank">{{ form.nameOrId }}</a>
        </template>
        <template v-else>
          {{ form.nameOrId }}
        </template>
      </template>

      <span v-if="showIdForDuplicateName" class="duplicate-form-id">({{ form.xmlFormId }})</span>
    </td>
    <td v-for="reviewState of visibleReviewStates" :key="reviewState" class="review-state">
      <span v-if="form.publishedAt != null" v-tooltip.no-aria="$t(`reviewState.${reviewState}`)">
        <template v-if="canLinkToSubmissions">
          <router-link :to="submissionsPath[reviewState]">
            <span class="tag" :class="reviewState === 'hasIssues' && form.reviewStates[reviewState] > 0 ? reviewStateTag(reviewState) : 'tag-info'">
              <span :class="reviewStateIcon(reviewState)"></span>
              {{ $n(form.reviewStates[reviewState], 'default') }}
            </span>
          </router-link>
        </template>
        <template v-else>
          <span class="tag" :class="reviewStateTag(reviewState)">
            <span :class="reviewStateIcon(reviewState)"></span>
            {{ $n(form.reviewStates[reviewState], 'default') }}
          </span>
        </template>
      </span>
    </td>
    <td class="last-submission">
      <span v-if="form.publishedAt != null" v-tooltip.no-aria="$t('header.lastSubmission')">
        <template v-if="form.lastSubmission != null">
          <template v-if="canLinkToSubmissions">
            <router-link :to="submissionsPath.all">
              <span class="icon-clock-o"></span>
              <date-time :iso="form.lastSubmission"
                :tooltip="false"/>
            </router-link>
          </template>
          <template v-else>
            <date-time :iso="form.lastSubmission"
              :tooltip="false"/>
          </template>
        </template>
        <template v-else>{{ $t('submission.noSubmission') }}</template>
      </span>
      <span v-else>{{ $t('formState.unpublished') }}</span>
    </td>
    <td class="total-submissions">
      <span v-if="form.publishedAt != null" v-tooltip.no-aria="$t('common.totalSubmissions')">
        <template v-if="canLinkToSubmissions">
          <router-link :to="submissionsPath.all">
            <span class="icon-star"></span>
            <span>{{ $n(form.submissions, 'default') }}</span>
          </router-link>
        </template>
        <template v-else>
          <span class="icon-star"></span>
          <span>{{ $n(form.submissions, 'default') }}</span>
        </template>
      </span>
    </td>
  </tr>
</template>

<script>
import DateTimeComponent from '../date-time.vue';
import FormLink from '../form/link.vue';

import useReviewState from '../../composables/review-state';
import useRoutes from '../../composables/routes';
import { useRequestData } from '../../request-data';

export default {
  name: 'ProjectFormRow',
  components: { DateTime: DateTimeComponent, FormLink },
  props: {
    form: {
      type: Object,
      required: true
    },
    project: {
      type: Object,
      required: true
    }
  },
  setup() {
    const { projects } = useRequestData();
    const { duplicateFormNamesPerProject } = projects.toRefs();
    const { formPath, newSubmissionPath } = useRoutes();
    const { reviewStateIcon, reviewStateTag } = useReviewState();
    return {
      duplicateFormNamesPerProject,
      formPath,
      newSubmissionPath,
      reviewStateIcon, reviewStateTag
    };
  },
  computed: {
    canLinkToDraftStatus() {
      return this.form.publishedAt == null && this.project.permits('form.update');
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
      return this.newSubmissionPath(this.form.projectId, this.form.xmlFormId, !this.form.publishedAt);
    },
    showIdForDuplicateName() {
      const formNames = this.duplicateFormNamesPerProject[this.project.id];
      if (formNames) {
        return formNames.has(this.form.nameOrId.toLocaleLowerCase());
      }
      return false;
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/mixins';

.project-form-row {
  td {
    padding: 4px 0px 4px 6px;
    color: $color-text-secondary;
    a {
      @include text-link;
      display: inline-block;
    }
    &.form-name a {
      color: $color-action-foreground;
    }
  }

  .duplicate-form-id {
    font-family: $font-family-monospace;
    font-size: 12px;
    padding-left: 6px;
  }

  .review-state, .total-submissions {
    padding-right: 10px;
    width: 120px;
  }

  .last-submission{
    width: 170px;

    [class*='icon'] {
      margin-left: 0;
    }
  }

  [class*='icon'] {
    margin-left: 5px;
    color: $color-text-muted;
  }
}
</style>
