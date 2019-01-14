<!--
Copyright 2017 ODK Central Developers
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
    <page-head v-show="maybeProject.success && maybeForm.success">
      <template slot="context">
        <span>{{ maybeProject.success ? maybeProject.data.name : '' }}</span>
        <router-link :to="`/projects/${projectId}`">
          Back to Project Overview
        </router-link>
      </template>
      <template slot="title">
        {{ maybeForm.success ? maybeForm.data.nameOrId() : '' }}
      </template>
      <template slot="tabs">
        <li :class="tabClass('')" role="presentation">
          <router-link :to="tabPath('')">Overview</router-link>
        </li>
        <li v-if="maybeAttachments.success && maybeAttachments.data.length !== 0"
          :class="tabClass('media-files')" role="presentation">
          <router-link :to="tabPath('media-files')">
            Media Files
            <span v-show="missingAttachments !== 0" class="badge">
              {{ missingAttachments.toLocaleString() }}
            </span>
          </router-link>
        </li>
        <li :class="tabClass('submissions')" role="presentation">
          <router-link :to="tabPath('submissions')">Submissions</router-link>
        </li>
        <li :class="tabClass('settings')" role="presentation">
          <router-link :to="tabPath('settings')">Settings</router-link>
        </li>
      </template>
    </page-head>
    <page-body>
      <loading :state="maybeProject.awaiting || maybeForm.awaiting"/>
      <!-- <router-view> is created and can send its own requests once the form
      response has been received. We do not wait for the project response in a
      similar way. -->
      <div v-if="maybeForm.success">
        <div v-show="maybeProject.success">
          <keep-alive>
            <router-view :project-id="projectId"
              :maybe-field-keys="maybeFieldKeys" :form="maybeForm.data"
              :attachments="maybeAttachments.data"
              :chunk-sizes="submissionChunkSizes"
              :scrolled-to-bottom="scrolledToBottom"
              @attachment-change="updateAttachment"
              @update:submissions="updateSubmissions"
              @state-change="updateState"/>
          </keep-alive>
        </div>
      </div>
    </page-body>
  </div>
</template>

<script>
import Form from '../../presenters/form';
import FormAttachment from '../../presenters/form-attachment';
import FormSubmissionList from './submission/list.vue';
import MaybeData from '../../maybe-data';
import request from '../../mixins/request';
import tab from '../../mixins/tab';

export default {
  name: 'FormShow',
  mixins: [request(), tab()],
  props: {
    projectId: {
      type: String,
      required: true
    },
    maybeProject: {
      type: MaybeData,
      required: true
    },
    maybeFieldKeys: {
      type: MaybeData,
      required: true
    }
  },
  data() {
    return {
      requestId: null,
      maybeForm: null,
      maybeAttachments: null,
      // Passing these to FormSubmissionList in order to facilitate
      // FormSubmissionList testing.
      submissionChunkSizes: FormSubmissionList.props.chunkSizes.default(),
      scrolledToBottom: FormSubmissionList.props.scrolledToBottom.default
    };
  },
  computed: {
    xmlFormId() {
      return this.$route.params.xmlFormId;
    },
    encodedFormId() {
      return encodeURIComponent(this.xmlFormId);
    },
    missingAttachments() {
      return this.maybeAttachments.data
        .filter(attachment => !attachment.exists)
        .length;
    }
  },
  watch: {
    xmlFormId() {
      this.fetchData();
    }
  },
  created() {
    this.fetchData();
  },
  methods: {
    fetchData() {
      this.maybeGet({
        maybeForm: {
          url: `/projects/${this.projectId}/forms/${this.encodedFormId}`,
          extended: true,
          transform: (data) => new Form(data)
        },
        maybeAttachments: {
          url: `/projects/${this.projectId}/forms/${this.encodedFormId}/attachments`,
          extended: true,
          transform: (data) => data.map(attachment => new FormAttachment(attachment))
        }
      });
    },
    tabPathPrefix() {
      return `/projects/${this.projectId}/forms/${this.encodedFormId}`;
    },
    updateAttachment(newAttachment) {
      const index = this.maybeAttachments.data
        .findIndex(attachment => attachment.name === newAttachment.name);
      this.$set(this.maybeAttachments.data, index, newAttachment);
    },
    updateSubmissions(submissions) {
      const form = this.maybeForm.data.with({ submissions });
      this.maybeForm = MaybeData.success(form);
    },
    updateState(newState) {
      const form = this.maybeForm.data.with({ state: newState });
      this.maybeForm = MaybeData.success(form);
    }
  }
};
</script>
