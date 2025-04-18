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
  <file-drop-zone id="form-edit" :disabled="dragDisabled" :styled="false"
    @dragenter="dragHandler" @dragleave="dragHandler" @drop="dragHandler">
    <loading :state="formDraft.initiallyLoading"/>
    <template v-if="formDraft.dataExists">
      <div class="row">
        <div v-if="formDraft.isEmpty()" class="col-xs-6">
          <form-edit-create-draft @success="fetchDraft(true)"/>
        </div>
        <div v-if="form.dataExists && form.publishedAt != null" class="col-xs-6">
          <form-edit-published-version/>
        </div>
      </div>
      <template v-if="formDraft.isDefined()">
        <form-edit-def @upload="uploadModal.show()"/>
        <form-draft-testing/>
        <form-edit-draft-controls @publish="publishModal.show()"
          @abandon="abandonModal.show()"/>
      </template>
    </template>

    <form-new v-bind="uploadModal" @hide="uploadModal.hide()" @success="afterUpload"/>
    <form-draft-publish v-if="formDraft.dataExists && formDraft.isDefined()"
      v-bind="publishModal" @hide="publishModal.hide()"
      @success="afterPublish"/>
    <form-draft-abandon v-bind="abandonModal" @hide="abandonModal.hide()"
      @success="afterAbandon"/>
  </file-drop-zone>
</template>

<script setup>
import { inject, provide, ref, watchEffect } from 'vue';
import { useI18n } from 'vue-i18n';

import FileDropZone from '../file-drop-zone.vue';
import FormDraftAbandon from '../form-draft/abandon.vue';
import FormDraftPublish from '../form-draft/publish.vue';
import FormDraftTesting from '../form-draft/testing.vue';
import FormEditCreateDraft from './edit/create-draft.vue';
import FormEditDef from './edit/def.vue';
import FormEditDraftControls from './edit/draft-controls.vue';
import FormEditPublishedVersion from './edit/published-version.vue';
import FormNew from './new.vue';
import Loading from '../loading.vue';

import useRoutes from '../../composables/routes';
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
  if (formDraft.get().entityRelated) {
    formDraftDatasetDiff.request({
      url: apiPaths.formDraftDatasetDiff(props.projectId, props.xmlFormId),
      resend: false
    }).catch(noop);
  }
});

/* We allow form attachments to be dragged and dropped anywhere in FormEdit.
That's why FileDropZone is in this component. But it's FormAttachmentList that
actually knows how to handle drag events. FormAttachmentList is a few layers
away from FormEdit, so the two communicate using refs. FormEdit provides the
refs, then FormAttachmentList sets their values. That approach allows the two
components to interact directly without getting intermediate components
involved. */
const dragDisabled = ref(false);
provide('dragDisabled', dragDisabled);
const dragHandler = ref(noop);
provide('dragHandler', dragHandler);

const uploadModal = modalData();
const { router, alert } = inject('container');
const { t } = useI18n();
const afterUpload = () => {
  fetchDraft(true);
  draftAttachments.reset();
  formDraftDatasetDiff.reset();

  uploadModal.hide();
  alert.success(t('alert.upload'));
};

const publishModal = modalData();
const afterPublish = () => {
  // Re-request the project in case its `datasets` property has changed.
  emit('fetch-project', true);
  emit('fetch-form');
  emit('fetch-linked-datasets');
  formDraft.setToNone();
  formVersions.reset();
  draftAttachments.reset();
  datasets.reset();
  formDraftDatasetDiff.reset();

  publishModal.hide();
  alert.success(t('alert.publish'));
};

const abandonModal = modalData();
const { projectPath } = useRoutes();
const afterAbandon = () => {
  if (form.publishedAt != null) {
    abandonModal.hide();
    alert.success(t('alert.abandon'));

    formDraft.setToNone();
    draftAttachments.reset();
    formDraftDatasetDiff.reset();
  } else {
    const { nameOrId } = form;
    router.push(projectPath())
      .then(() => { alert.success(t('alert.delete', { name: nameOrId })); });
  }
};
</script>

<style lang="scss">
#form-edit {
  padding-inline: 10px;
}

body:has(#form-edit) { background-color: #fff; }
</style>

<i18n lang="json5">
{
  "en": {
    "alert": {
      // @transifexKey component.FormDraftStatus.alert.upload
      "upload": "Success! The new Form definition has been saved as your Draft.",
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
