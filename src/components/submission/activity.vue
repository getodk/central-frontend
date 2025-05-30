<!--
Copyright 2021 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <page-section id="submission-activity">
    <template #heading>
      <span>{{ $t('common.activity') }}</span>
      <template v-if="project.dataExists && project.permits('submission.update')">
        <button id="submission-activity-review-button" type="button"
          class="btn btn-default" @click="$emit('review')">
          <span class="icon-check"></span>{{ $t('action.review') }}
        </button>
        <template v-if="submission.dataExists">
          <a v-if="submission.__system.status == null"
            id="submission-activity-edit-button" class="btn btn-default"
            :href="editPath">
            <span class="icon-pencil"></span>{{ $t('action.edit') }}
          </a>
          <button v-else id="submission-activity-edit-button" type="button"
            class="btn btn-default" aria-disabled="true"
            v-tooltip.aria-describedby="$t('submission.editDisabled')">
            <span class="icon-pencil"></span>{{ $t('action.edit') }}
          </button>
        </template>
        <button v-if="project.dataExists && project.permits('submission.delete')"
          id="submission-activity-delete-button" type="button" class="btn btn-default"
          @click="$emit('delete')">
          <span class="icon-trash"></span>{{ $t('action.delete') }}
        </button>
      </template>
    </template>
    <template #body>
      <submission-comment :project-id="projectId" :xml-form-id="xmlFormId"
        :instance-id="instanceId" :feed="feed" @success="$emit('comment')"/>
      <loading :state="initiallyLoading"/>
      <template v-if="feed != null">
        <submission-feed-entry v-for="(entry, index) in feed" :key="index" :entry="entry"
          :project-id="projectId" :xml-form-id="xmlFormId" :instance-id="instanceId"/>
      </template>
    </template>
  </page-section>
</template>

<script>
import { DateTime } from 'luxon';
import { descend } from 'ramda';

import Loading from '../loading.vue';
import PageSection from '../page/section.vue';
import SubmissionComment from './comment.vue';
import SubmissionFeedEntry from './feed-entry.vue';

import useRoutes from '../../composables/routes';
import { useRequestData } from '../../request-data';

export default {
  name: 'SubmissionActivity',
  components: { Loading, PageSection, SubmissionComment, SubmissionFeedEntry },
  props: {
    projectId: {
      type: String,
      required: true
    },
    xmlFormId: {
      type: String,
      required: true
    },
    instanceId: {
      type: String,
      required: true
    }
  },
  emits: ['review', 'comment', 'delete'],
  setup() {
    // The component does not assume that this data will exist when the
    // component is created.
    const { project, form, submission, audits, comments, diffs, fields, resourceStates } = useRequestData();
    const { editSubmissionPath } = useRoutes();
    return {
      project, form, submission, audits, comments, diffs, fields,
      ...resourceStates([audits, comments, diffs, fields]),
      editSubmissionPath
    };
  },
  computed: {
    editPath() {
      if (!this.form.dataExists) return null;
      return this.editSubmissionPath(
        this.projectId,
        this.xmlFormId,
        this.instanceId,
        this.form.webformsEnabled
      );
    },
    feed() {
      if (!this.dataExists) return null;

      return [...this.audits, ...this.comments].sort(
        descend(entry => DateTime.fromISO(entry.loggedAt != null
          ? entry.loggedAt
          : entry.createdAt))
      );
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#submission-activity { margin-bottom: 35px; }
#submission-activity-review-button { margin-right: 5px; }
#submission-activity-edit-button { margin-right: 5px; }
#submission-activity-delete-button .icon-trash { color: $color-danger; }
</style>
