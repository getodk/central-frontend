<!--
Copyright 2020 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/opendatakit/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div>
    <div v-if="dataExists" class="row">
      <div class="col-xs-6">
        <page-section condensed>
          <template #heading>
            <span>Draft Checklist</span>
          </template>
          <template #body>
            <form-draft-checklist/>
          </template>
        </page-section>
      </div>
      <div class="col-xs-6">
        <page-section condensed>
          <template #heading>
            <span>Your Current Draft</span>
          </template>
          <template #body>
            <form-version-summary-item :version="formDraft.get()">
              <template #body>
                <p><strong>Draft version</strong> of this Form.</p>
                <button id="form-draft-status-upload-button" type="button"
                  class="btn btn-primary" @click="showModal('upload')">
                  <!-- TODO. Add icon. -->
                  <span class="icon-upload"></span>Upload new definition&hellip;
                </button>
              </template>
            </form-version-summary-item>
          </template>
        </page-section>
        <page-section condensed>
          <template #heading>
            <span>Actions</span>
          </template>
          <template #body>
            <button id="form-draft-status-publish-button" type="button"
              class="btn btn-primary" @click="showModal('publish')">
              <span class="icon-check"></span>Publish draft&hellip;
            </button>
          </template>
        </page-section>
      </div>
    </div>
    <form-new v-bind="upload" @hide="hideModal('upload')"
      @success="afterUpload"/>
    <form-draft-publish v-bind="publish" @hide="hideModal('publish')"
      @success="afterPublish"/>
  </div>
</template>

<script>
import FormDraftChecklist from './checklist.vue';
import FormDraftPublish from './publish.vue';
import FormNew from '../form/new.vue';
import FormVersionSummaryItem from '../form-version/summary-item.vue';
import Option from '../../util/option';
import PageSection from '../page/section.vue';
import modal from '../../mixins/modal';
import routes from '../../mixins/routes';
import validateData from '../../mixins/validate-data';
import { requestData } from '../../store/modules/request';

// The component does not assume that this data will exist when the component is
// created.
const requestKeys = ['formDraft'];

export default {
  name: 'FormDraftStatus',
  components: {
    FormNew,
    FormDraftChecklist,
    FormDraftPublish,
    FormVersionSummaryItem,
    PageSection
  },
  mixins: [modal(), routes(), validateData()],
  data() {
    return {
      upload: {
        state: false
      },
      publish: {
        state: false
      }
    };
  },
  computed: {
    ...requestData(requestKeys),
    dataExists() {
      return this.$store.getters.dataExists(requestKeys);
    }
  },
  methods: {
    afterUpload() {
      this.$emit('fetch-draft');
      this.hideModal('upload');
      this.$alert().success('Success! The new Form definition has been uploaded.');
    },
    afterPublish() {
      this.$emit('fetch-form');
      this.$store.commit('setData', {
        key: 'formDraft',
        value: Option.none()
      });
      this.$store.commit('setData', {
        key: 'attachments',
        value: Option.none()
      });
      this.$router.push(this.formPath(), () => {
        this.$alert().success('Your Draft is now published. Any devices retrieving Forms for this Project will now receive the new Form definition and Media Files.');
      });
    }
  }
};
</script>
