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
  <div>
    <div class="row">
      <div class="col-xs-6">
        <form-edit-loading-draft v-if="!formDraft.dataExists"/>
        <form-edit-create-draft v-else-if="formDraft.isEmpty()"
          @success="fetchDraft(true)"/>
        <form-edit-draft-controls v-else @publish="publishModal.show()"
          @abandon="abandonModal.show()"/>
      </div>
    </div>
    <template v-if="formDraft.dataExists && formDraft.isDefined()">
      <form-draft-status @fetch-draft="fetchDraft(true)"/>
      <form-attachment-list v-if="rendersAttachments"/>
      <form-draft-testing/>
    </template>

    <form-draft-publish v-if="formDraft.dataExists && formDraft.isDefined()"
      v-bind="publishModal" @hide="publishModal.hide()"
      @success="afterPublish"/>
    <form-draft-abandon v-bind="abandonModal" @hide="abandonModal.hide()"
      @success="afterAbandon"/>
  </div>
</template>

<script setup>
import { computed, inject, provide, watchEffect } from 'vue';
import { useI18n } from 'vue-i18n';

import FormAttachmentList from '../form-attachment/list.vue';
import FormDraftAbandon from '../form-draft/abandon.vue';
import FormDraftPublish from '../form-draft/publish.vue';
import FormDraftStatus from '../form-draft/status.vue';
import FormDraftTesting from '../form-draft/testing.vue';
import FormEditCreateDraft from './edit/create-draft.vue';
import FormEditDraftControls from './edit/draft-controls.vue';
import FormEditLoadingDraft from './edit/loading-draft.vue';

import useRoutes from '../../composables/routes';
import { afterNextNavigation } from '../../util/router';
import { apiPaths } from '../../util/request';
import { modalData } from '../../util/reactivity';
import { noop } from '../../util/util';
import { useRequestData } from '../../request-data';

defineOptions({
  name: 'FormEdit'
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
const emit = defineEmits(['fetch-project', 'fetch-form', 'fetch-linked-datasets']);
provide('projectId', props.projectId);
provide('xmlFormId', props.xmlFormId);

const { form, formVersions, formDraft, draftAttachments, datasets, formDraftDatasetDiff } = useRequestData();

const fetchDraft = (resend) => {
  formDraft.request({
    url: apiPaths.formDraft(props.projectId, props.xmlFormId),
    extended: true,
    fulfillProblem: ({ code }) => code === 404.1,
    resend
  }).catch(noop);
};
fetchDraft(false);

// Most requests only need to be sent if there is a form draft. Here, we check
// whether there is a form draft before sending additional requests.
watchEffect(() => {
  if (!(formDraft.dataExists && formDraft.isDefined())) return;
  Promise.allSettled([
    draftAttachments.request({
      url: apiPaths.formDraftAttachments(props.projectId, props.xmlFormId),
      resend: false
    }),
    formVersions.request({
      url: apiPaths.formVersions(props.projectId, props.xmlFormId),
      extended: true,
      resend: false
    })
  ]);
});

const publishModal = modalData();
const { router, alert } = inject('container');
const { t } = useI18n();
const { projectPath, publishedFormPath } = useRoutes();
const afterPublish = () => {
  // We need to clear the form before navigating to the submissions page: if the
  // form didn't already have a published version, then there would be a
  // validateData violation if we didn't clear it.
  emit('fetch-form');

  // Other resources that may have changed after publish
  emit('fetch-linked-datasets');
  datasets.reset();
  formDraftDatasetDiff.reset();

  // We will update additional resources, but only after navigating to the
  // submissions page. We need to wait to update these resources because they
  // are used on the current page.
  afterNextNavigation(router, () => {
    // Re-request the project in case its `datasets` property has changed.
    emit('fetch-project', true);
    formVersions.data = null;
    formDraft.setToNone();
    draftAttachments.reset();

    alert.success(t('alert.publish'));
  });
  router.push(publishedFormPath());
};

const abandonModal = modalData();
const afterAbandon = () => {
  formDraftDatasetDiff.reset();
  if (form.publishedAt != null) {
    afterNextNavigation(router, () => {
      formDraft.setToNone();
      draftAttachments.reset();
      alert.success(t('alert.abandon'));
    });
    router.push(publishedFormPath());
  } else {
    const { nameOrId } = form;
    afterNextNavigation(router, () => {
      alert.success(t('alert.delete', { name: nameOrId }));
    });
    router.push(projectPath());
  }
};

const rendersAttachments = computed(() =>
  draftAttachments.dataExists && draftAttachments.size !== 0);
</script>

<i18n lang="json5">
{
  "en": {
    "alert": {
      // @transifexKey component.FormDraftStatus.alert.publish
      "publish": "Your Draft is now published. Any devices retrieving Forms for this Project will now receive the new Form definition and Form Attachments.",
      // @transifexKey component.FormDraftStatus.alert.abandon
      "abandon": "The Draft version of this Form has been successfully deleted.",
      // @transifexKey component.FormDraftStatus.alert.delete
      "delete": "The Form “{name}” was deleted."
    }
  }
}
</i18n>
