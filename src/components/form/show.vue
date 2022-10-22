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
import { DateTime } from 'luxon';

import FormHead from './head.vue';
import Loading from '../loading.vue';
import PageBody from '../page/body.vue';

import request from '../../mixins/request';
import routes from '../../mixins/routes';
import useCallWait from '../../composables/call-wait';
import useForm from '../../request-data/form';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
import { useRequestData } from '../../request-data';

export default {
  name: 'FormShow',
  components: { FormHead, Loading, PageBody },
  mixins: [request(), routes()],
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

    const { callWait, cancelCall } = useCallWait();
    return {
      project, form, formDraft, attachments,
      ...resourceStates([project, form, formDraft, attachments]),
      callWait, cancelCall
    };
  },
  data() {
    return {
      awaitingResponse: false
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
    // Wait for up to a total of 10 minutes, not including request time.
    waitToRequestEnketoId(tries) {
      if (tries < 20) return 3000;
      if (tries < 50) return 8000;
      if (tries < 70) return 15000;
      return null;
    },
    fetchForm() {
      this.cancelCall('fetchEnketoIdsForForm');
      const url = apiPaths.form(this.projectId, this.xmlFormId);
      this.form.request({ url, extended: true })
        .then(() => {
          if (this.form.enketoId != null && this.form.enketoOnceId != null)
            return;
          if (this.form.publishedAt == null) return;
          // If Enketo hasn't finished processing the form in 15 minutes,
          // something else has probably gone wrong.
          if (Date.now() -
            DateTime.fromISO(this.form.publishedAt).toMillis() > 900000)
            return;
          this.callWait(
            'fetchEnketoIdsForForm',
            async () => {
              await this.form.request({
                url,
                patch: ({ data }) => {
                  this.form.enketoId = data.enketoId;
                  this.form.enketoOnceId = data.enketoOnceId;
                },
                alert: false
              });
              return this.form.enketoId != null &&
                this.form.enketoOnceId != null;
            },
            this.waitToRequestEnketoId
          );
        })
        .catch(noop);
    },
    fetchDraft() {
      this.cancelCall('fetchEnketoIdForDraft');
      const draftUrl = apiPaths.formDraft(this.projectId, this.xmlFormId);
      Promise.allSettled([
        this.formDraft.request({
          url: draftUrl,
          extended: true,
          fulfillProblem: ({ code }) => code === 404.1
        })
          .then(() => {
            if (this.formDraft.isEmpty()) return;
            if (this.formDraft.get().enketoId != null) return;
            this.callWait(
              'fetchEnketoIdForDraft',
              async () => {
                await this.formDraft.request({
                  url: draftUrl,
                  patch: ({ data }) => {
                    if (this.formDraft.isDefined())
                      this.formDraft.get().enketoId = data.enketoId;
                  },
                  alert: false
                });
                if (this.formDraft.isEmpty()) return true;
                // We do not check that the form draft has not changed, for
                // example, by another user concurrently modifying the draft.
                return this.formDraft.get().enketoId != null;
              },
              this.waitToRequestEnketoId
            );
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
      this.post(apiPaths.formDraft(this.projectId, this.xmlFormId))
        .then(() => {
          this.fetchDraft();
          this.$router.push(this.formPath('draft'));
        })
        .catch(noop);
    }
  }
};
</script>
