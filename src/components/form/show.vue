<!--
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div>
    <form-head v-show="dataExists && !awaitingResponse"
      @create-draft="createDraft"/>
    <page-body>
      <loading :state="initiallyLoading || awaitingResponse"/>
      <!-- <router-view> may send its own requests before the server has
      responded to the requests from FormShow. -->
      <router-view v-show="dataExists && !awaitingResponse"
        @fetch-project="fetchProject" @fetch-form="fetchForm"
        @fetch-draft="fetchDraft" @fetch-linked-datasets="fetchLinkedDatasets"/>
    </page-body>
  </div>
</template>

<script setup>
import { nextTick, watchEffect } from 'vue';
import { useRouter } from 'vue-router';

import FormHead from './head.vue';
import Loading from '../loading.vue';
import PageBody from '../page/body.vue';

import useDatasets from '../../request-data/datasets';
import useForm from '../../request-data/form';
import useRequest from '../../composables/request';
import useRoutes from '../../composables/routes';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
import { useRequestData } from '../../request-data';

defineOptions({
  name: 'FormShow'
});
const props = defineProps({
  projectId: {
    type: String,
    required: true
  },
  xmlFormId: {
    type: String,
    required: true
  }
});

const { project, resourceStates } = useRequestData();
const { form, formDraft, attachments, publishedAttachments, formDatasetDiff, appUserCount } = useForm();
useDatasets();
const { initiallyLoading, dataExists } = resourceStates([project, form, formDraft, attachments]);

const fetchProject = (resend) => {
  project.request({
    url: apiPaths.project(props.projectId),
    extended: true,
    resend
  }).catch(noop);
};
const fetchForm = () => {
  form.request({
    url: apiPaths.form(props.projectId, props.xmlFormId),
    extended: true
  }).catch(noop);
};
const fetchDraft = () => {
  Promise.allSettled([
    formDraft.request({
      url: apiPaths.formDraft(props.projectId, props.xmlFormId),
      extended: true,
      fulfillProblem: ({ code }) => code === 404.1
    }),
    attachments.request({
      url: apiPaths.formDraftAttachments(props.projectId, props.xmlFormId),
      fulfillProblem: ({ code }) => code === 404.1
    })
  ]);
};
const fetchLinkedDatasets = () => {
  Promise.allSettled([
    publishedAttachments.request({
      url: apiPaths.publishedAttachments(props.projectId, props.xmlFormId)
    }),
    formDatasetDiff.request({
      url: apiPaths.formDatasetDiff(props.projectId, props.xmlFormId)
    })
  ]);
};

fetchProject(false);
fetchForm();
fetchDraft();
// Before sending certain requests, we wait for the project response in order to
// check whether the user has the correct permissions.
const stopAppUsersEffect = watchEffect(() => {
  if (!project.dataExists) return;
  if (project.permits('assignment.list')) {
    appUserCount.request({
      url: apiPaths.formActors(props.projectId, props.xmlFormId, 'app-user')
    }).catch(noop);
  }
  /* It doesn't work to call stopAppUsersEffect() synchronously. You can see
  that if you remove the nextTick() and try running tests. I think the reason
  why is that if you navigate from another page that has fetched `project`
  already (e.g., the form list), then project.dataExists will be `true`, so the
  watch effect will complete synchronously during component setup. But in that
  case, watchEffect() won't have had a chance to return a value:
  stopAppUsersEffect won't be assigned yet. */
  nextTick(() => stopAppUsersEffect());
});
const stopDatasetsEffect = watchEffect(() => {
  if (!(project.dataExists && form.dataExists)) return;
  if (project.permits(['form.update', 'dataset.list']) && form.publishedAt != null)
    fetchLinkedDatasets();
  stopDatasetsEffect();
});

const { request, awaitingResponse } = useRequest();
const router = useRouter();
const { formPath } = useRoutes();
const createDraft = () => {
  request({
    method: 'POST',
    url: apiPaths.formDraft(props.projectId, props.xmlFormId)
  })
    .then(() => {
      fetchDraft();
      router.push(formPath('draft'));
    })
    .catch(noop);
};
</script>
