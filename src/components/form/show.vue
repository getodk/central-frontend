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
        @fetch-draft="fetchDraft"/>
    </page-body>
  </div>
</template>

<script>
import FormHead from './head.vue';
import Loading from '../loading.vue';
import PageBody from '../page/body.vue';

import useForm from '../../request-data/form';
import useDatasets from '../../request-data/datasets';
import useRequest from '../../composables/request';
import useRoutes from '../../composables/routes';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
import { useRequestData } from '../../request-data';

export default {
  name: 'FormShow',
  components: { FormHead, Loading, PageBody },
  props: {
    projectId: {
      type: String,
      required: true
    },
    xmlFormId: {
      type: String,
      required: true
    }
  },
  setup() {
    const { project, resourceStates } = useRequestData();
    const { form, formDraft, attachments } = useForm();
    useDatasets();

    const { request, awaitingResponse } = useRequest();
    const { formPath } = useRoutes();
    return {
      project, form, formDraft, attachments,
      ...resourceStates([project, form, formDraft, attachments]),
      request, awaitingResponse, formPath
    };
  },
  created() {
    this.fetchData();
  },
  methods: {
    fetchProject(resend) {
      this.project.request({
        url: apiPaths.project(this.projectId),
        extended: true,
        resend
      }).catch(noop);
    },
    fetchForm() {
      const url = apiPaths.form(this.projectId, this.xmlFormId);
      this.form.request({ url, extended: true })
        .catch(noop);
    },
    fetchDraft() {
      const draftUrl = apiPaths.formDraft(this.projectId, this.xmlFormId);
      Promise.allSettled([
        this.formDraft.request({
          url: draftUrl,
          extended: true,
          fulfillProblem: ({ code }) => code === 404.1
        }),
        this.attachments.request({
          url: apiPaths.formDraftAttachments(this.projectId, this.xmlFormId),
          fulfillProblem: ({ code }) => code === 404.1
        })
      ]);
    },
    fetchData() {
      this.fetchProject(false);
      this.fetchForm();
      this.fetchDraft();
    },
    createDraft() {
      this.request({
        method: 'POST',
        url: apiPaths.formDraft(this.projectId, this.xmlFormId)
      })
        .then(() => {
          this.fetchDraft();
          this.$router.push(this.formPath('draft'));
        })
        .catch(noop);
    }
  }
};
</script>
