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
    <page-head v-show="project != null && form != null && attachments != null">
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
      <loading
        :state="$store.getters.initiallyLoading(['project', 'form', 'attachments'])"/>
      <!-- <router-view> is created and can send its own requests once responses
      have been received for the form and its attachments. We do not wait in a
      similar way for the responses for the project and its app users. -->
      <div v-if="form != null && attachments != null">
        <div v-show="project != null">
          <keep-alive>
            <router-view :project-id="projectId"
              :chunk-sizes="submissionChunkSizes"
              :scrolled-to-bottom="scrolledToBottom"/>
          </keep-alive>
        </div>
      </div>
    </page-body>
  </div>
</template>

<script>
import FormSubmissionList from './submission/list.vue';
import tab from '../../mixins/tab';
import { requestData } from '../../store/modules/request';

export default {
  name: 'FormShow',
  mixins: [tab()],
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
  data() {
    return {
      // Passing these to FormSubmissionList in order to facilitate
      // FormSubmissionList testing.
      submissionChunkSizes: FormSubmissionList.props.chunkSizes.default(),
      scrolledToBottom: FormSubmissionList.props.scrolledToBottom.default
    };
  },
  computed: {
    ...requestData(['project', 'form', 'attachments']),
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
    tabPathPrefix() {
      return `/projects/${this.projectId}/forms/${this.encodedFormId}`;
    },
    fetchData() {
      this.$store.dispatch('get', [
        {
          key: 'form',
          url: `/projects/${this.projectId}/forms/${this.encodedFormId}`,
          extended: true
        },
        {
          key: 'attachments',
          url: `/projects/${this.projectId}/forms/${this.encodedFormId}/attachments`,
          extended: true
        }
      ]).catch(() => {});
    }
  }
};
</script>
