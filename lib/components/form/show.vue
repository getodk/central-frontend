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
    <page-head v-show="project != null && form != null">
      <template slot="context">
        <span>{{ project != null ? project.name : '' }}</span>
        <router-link :to="`/projects/${projectId}`">
          Back to Project Overview
        </router-link>
      </template>
      <template slot="title">
        {{ form != null ? form.nameOrId() : '' }}
      </template>
      <template slot="tabs">
        <li :class="tabClass('')" role="presentation">
          <router-link :to="tabPath('')">Overview</router-link>
        </li>
        <li v-if="attachments != null && attachments.length !== 0"
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
      <loading :state="project == null || awaitingResponse"/>
      <!-- It might be possible to remove this <div> element and move the v-if
      to <keep-alive> or <router-view>. However, I'm not sure that <keep-alive>
      supports that use case. -->
      <div v-if="project != null && form != null">
        <keep-alive>
          <router-view :project-id="projectId" :form="form"
            :attachments="attachments" :chunk-sizes="submissionChunkSizes"
            :scrolled-to-bottom="scrolledToBottom"
            @attachment-change="updateAttachment"
            @update:submissions="updateSubmissions"
            @state-change="updateState"/>
        </keep-alive>
      </div>
    </page-body>
  </div>
</template>

<script>
import Form from '../../presenters/form';
import FormAttachment from '../../presenters/form-attachment';
import FormSubmissionList from './submission/list.vue';
import request from '../../mixins/request';
import tab from '../../mixins/tab';

export default {
  name: 'FormShow',
  mixins: [request(), tab()],
  props: {
    projectId: {
      type: Number,
      required: true
    },
    project: Object // eslint-disable-line vue/require-default-prop
  },
  data() {
    return {
      requestId: null,
      form: null,
      attachments: null,
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
      return this.attachments.filter(attachment => !attachment.exists).length;
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
      this.form = null;
      this.attachments = null;
      const formPath = `/projects/${this.projectId}/forms/${this.encodedFormId}`;
      const headers = { 'X-Extended-Metadata': 'true' };
      this.requestAll([
        this.$http.get(formPath, { headers }),
        this.$http.get(`${formPath}/attachments`, { headers })
      ])
        .then(([form, attachments]) => {
          this.form = new Form(form.data);
          this.attachments = attachments.data
            .map(attachment => new FormAttachment(attachment));
        })
        .catch(() => {});
    },
    tabPathPrefix() {
      return `/projects/${this.projectId}/forms/${this.encodedFormId}`;
    },
    updateAttachment(newAttachment) {
      const index = this.attachments
        .findIndex(attachment => attachment.name === newAttachment.name);
      this.$set(this.attachments, index, newAttachment);
    },
    updateSubmissions(submissions) {
      this.form = this.form.with({ submissions });
    },
    updateState(newState) {
      this.form = this.form.with({ state: newState });
    }
  }
};
</script>
