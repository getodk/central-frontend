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
        @fetch-form="fetchForm" @fetch-draft="fetchDraft"/>
    </page-body>
  </div>
</template>

<script>
import { DateTime } from 'luxon';
import { inject, watchSyncEffect } from 'vue';
import { pick } from 'ramda';

import FormHead from './head.vue';
import Loading from '../loading.vue';
import PageBody from '../page/body.vue';

import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
import { useCallWait } from '../../reusables/call-wait';
import { usePaths } from '../../reusables/paths';
import { useRequests } from '../../reusables/requests';

// Wait for up to a total of 10 minutes, not including request time.
const waitToFetchEnketoId = (tries) => {
  if (tries < 20) return 3000;
  if (tries < 50) return 8000;
  if (tries < 70) return 15000;
  return null;
};
const fetchEnketoIdsForForm = (form, callWait) => {
  if (form.data.enketoId != null && form.data.enketoOnceId != null) return;
  if (form.data.publishedAt == null) return;
  // If Enketo hasn't finished processing the form in 15 minutes, something else
  // has probably gone wrong.
  if (Date.now() - DateTime.fromISO(form.data.publishedAt).toMillis() > 900000)
    return;
  callWait(
    'fetchEnketoIdsForForm',
    async () => {
      await form.request({
        url: apiPaths.form(form.data.projectId, form.data.xmlFormId),
        update: (response) => {
          form.update(pick(['enketoId', 'enketoOnceId'], response.data));
        },
        alert: false
      });
      return form.data.enketoId != null && form.data.enketoOnceId != null;
    },
    waitToFetchEnketoId
  );
};

const fetchEnketoIdForDraft = (formDraft, callWait) => {
  if (formDraft.data.isEmpty() || formDraft.data.get().enketoId != null) return;
  callWait(
    'fetchEnketoIdForDraft',
    async () => {
      const { projectId, xmlFormId } = formDraft.data.get();
      await formDraft.request({
        url: apiPaths.formDraft(projectId, xmlFormId),
        update: (response) => {
          formDraft.update(pick(['enketoId'], response.data));
        },
        alert: false
      });
      // We do not check that the form draft has not changed, for example, by
      // another user concurrently modifying the draft.
      return formDraft.data.get().enketoId != null;
    },
    waitToFetchEnketoId
  );
};

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
  setup(props) {
    const container = inject('container');
    const { router, requestData } = container;
    const { project, form, formDraft, attachments } = requestData;
    project.request({
      url: apiPaths.project(props.projectId),
      extended: true,
      resend: false
    }).catch(noop);

    const { callWait, cancelCall } = useCallWait();
    const fetchForm = () => {
      cancelCall('fetchEnketoIdsForForm');
      form.request({
        url: apiPaths.form(props.projectId, props.xmlFormId),
        extended: true
      })
        .then(() => { fetchEnketoIdsForForm(form, callWait); })
        .catch(noop);
    };
    fetchForm();

    const fetchDraft = () => {
      cancelCall('fetchEnketoIdForDraft');
      formDraft.request({
        url: apiPaths.formDraft(props.projectId, props.xmlFormId),
        extended: true
      })
        .then(() => { fetchEnketoIdForDraft(formDraft, callWait); })
        .catch(noop);

      attachments.request({
        url: apiPaths.formDraftAttachments(props.projectId, props.xmlFormId)
      }).catch(noop);
    };
    fetchDraft();
    watchSyncEffect(() => {
      if (formDraft.data == null || attachments.data == null) return;
      if (formDraft.data.isDefined() && attachments.data.isEmpty())
        formDraft.setToNone();
      else if (formDraft.data.isEmpty() && attachments.data.isDefined())
        formDraft.setToNone();
    });

    const keys = ['project', 'form', 'formDraft', 'attachments'];
    const initiallyLoading = requestData.initiallyLoading(keys);
    const dataExists = requestData.dataExists(keys);

    const { request, awaitingResponse } = useRequests(container);
    const { formPath } = usePaths(router);
    const createDraft = () => request({
      method: 'POST',
      url: apiPaths.formDraft(props.projectId, props.xmlFormId)
    })
      .then(() => {
        fetchDraft();
        router.push(formPath('draft'));
      })
      .catch(noop);

    return {
      initiallyLoading, dataExists, fetchForm, fetchDraft,
      createDraft, awaitingResponse
    };
  }
};
</script>
