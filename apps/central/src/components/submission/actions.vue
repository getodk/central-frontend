<!--
Copyright 2025 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div class="submission-actions btn-group">
    <button v-if="project.verbs.has('submission.delete')" type="button"
      class="delete-button btn btn-default">
      <span class="icon-trash"></span>{{ $t('action.delete') }}<spinner :state="awaitingResponse"/>
    </button>
    <template v-if="project.verbs.has('submission.update')">
      <a v-if="submission.__system.status == null" class="btn btn-default"
        :href="editPath" target="_blank">
        <span class="icon-pencil"></span>{{ $t('action.edit') }}
      </a>
      <button v-else type="button" class="btn btn-default"
        :aria-label="editLabel" aria-disabled="true"
        v-tooltip.aria-describedby="$t('submission.editDisabled')">
        <span class="icon-pencil"></span>{{ $t('action.edit') }}
      </button>
      <button type="button" class="review-button btn btn-primary">
        <span class="icon-check"></span>{{ $t('action.review') }}
      </button>
    </template>
    <router-link v-slot="{ href }" :to="detailPath" custom>
      <a class="more-button btn btn-default" :href="href" target="_blank">
        <span>{{ $t('action.more') }}</span>
        <span class="icon-angle-right"></span>
      </a>
    </router-link>
  </div>
</template>

<script setup>
// This component is tested via the tests of SubmissionMetadataRow.

import { computed } from 'vue';

import Spinner from '../spinner.vue';

import useRoutes from '../../composables/routes';
import { useRequestData } from '../../request-data';

defineOptions({
  name: 'SubmissionActions'
});
const props = defineProps({
  submission: {
    type: Object,
    required: true
  },
  awaitingResponse: Boolean
});

const { project, form } = useRequestData();

const { submissionPath, editSubmissionPath } = useRoutes();
const detailPath = computed(() =>
  submissionPath(form.projectId, form.xmlFormId, props.submission.__id));

const editPath = computed(() => editSubmissionPath(
  form.projectId,
  form.xmlFormId,
  props.submission.__id,
  form.webformsEnabled
));
</script>
