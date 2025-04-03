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
  <loading :state="true"/>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';

import Loading from './loading.vue';
import { noop } from '../util/util';
import useRoutes from '../composables/routes';
import { useRequestData } from '../request-data';
import { apiPaths, queryString } from '../util/request';

defineOptions({
  name: 'EnketoRedirector'
});

const props = defineProps({
  enketoId: {
    type: String,
    required: true
  },
  actionType: {
    type: String,
    required: true
  }
});

const { form } = useRequestData();
const router = useRouter();
const route = useRoute();
const { submissionPath, newSubmissionPath, formPreviewPath, offlineSubmissionPath } = useRoutes();

form.request({
  url: apiPaths.formByEnketoId(props.enketoId),
})
  .then(() => {
    let target = '/';

    // Edit
    // note: we don't support editing of draft submissions
    if (props.actionType === 'edit') {
      // if route.query.instance_id is not there then it will not match any path and page not found
      // will be displayed.
      target = submissionPath(form.projectId, form.xmlFormId, route.query.instance_id, 'edit');
    }
    // New
    if (props.actionType === 'new') {
      target = newSubmissionPath(form.projectId, form.xmlFormId, !form.publishedAt);
    }

    // Preview
    if (props.actionType === 'preview') {
      target = formPreviewPath(form.projectId, form.xmlFormId, !form.publishedAt);
    }

    // Offline
    if (props.actionType === 'offline') {
      target = offlineSubmissionPath(form.projectId, form.xmlFormId, !form.publishedAt);
    }

    router.replace(`${target}${queryString(route.query)}`);
  })
  .catch(noop);

</script>
