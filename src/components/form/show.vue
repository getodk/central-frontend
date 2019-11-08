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
    <page-head v-show="dataExists">
      <template v-if="project != null" #context>
        <span>
          <router-link :to="`/projects/${projectId}`">
            {{ project.name }}{{ project.archived ? ' (archived)' : '' }}</router-link>
        </span>
        <router-link :to="`/projects/${projectId}`">Back to Project Overview</router-link>
      </template>
      <template v-if="form != null" #title>
        {{ form.nameOrId() }}
      </template>
      <template #tabs>
        <li v-if="canRoute(tabPath(''))" :class="tabClass('')"
          role="presentation">
          <router-link :to="tabPath('')">Overview</router-link>
        </li>
        <li v-if="rendersMediaFilesTab" :class="tabClass('media-files')"
          role="presentation">
          <router-link :to="tabPath('media-files')">
            Media Files
            <span v-show="missingAttachmentCount !== 0" class="badge">
              {{ missingAttachmentCount.toLocaleString() }}
            </span>
          </router-link>
        </li>
        <!-- Everyone with access to the project should be able to navigate to
        SubmissionList. -->
        <li :class="tabClass('submissions')" role="presentation">
          <router-link :to="tabPath('submissions')">Submissions</router-link>
        </li>
        <li v-if="canRoute(tabPath('settings'))" :class="tabClass('settings')"
          role="presentation">
          <router-link :to="tabPath('settings')">Settings</router-link>
        </li>
      </template>
    </page-head>
    <page-body>
      <loading :state="initiallyLoading"/>
      <div v-show="dataExists">
        <!-- We only include SubmissionList, because it is the only component
        whose state we want to preserve when the user navigates to a different
        tab. -->
        <keep-alive include="SubmissionList">
          <!-- <router-view> is immediately created and can send its own
          requests even before the server has responded to the requests from
          ProjectHome and FormShow. -->
          <router-view :project-id="projectId" :xml-form-id="xmlFormId"
            :chunk-sizes="submissionChunkSizes"
            :scrolled-to-bottom="scrolledToBottom"/>
        </keep-alive>
      </div>
    </page-body>
  </div>
</template>

<script>
import SubmissionList from '../submission/list.vue';
import canRoute from '../../mixins/can-route';
import tab from '../../mixins/tab';
import { noop } from '../../util/util';
import { requestData } from '../../store/modules/request';

const REQUEST_KEYS = ['project', 'form', 'attachments'];

export default {
  name: 'FormShow',
  mixins: [canRoute(), tab()],
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
      // Passing these to SubmissionList in order to facilitate SubmissionList
      // testing.
      submissionChunkSizes: SubmissionList.props.chunkSizes.default(),
      scrolledToBottom: SubmissionList.props.scrolledToBottom.default
    };
  },
  computed: {
    ...requestData(REQUEST_KEYS),
    initiallyLoading() {
      return this.$store.getters.initiallyLoading(REQUEST_KEYS);
    },
    dataExists() {
      return this.$store.getters.dataExists(REQUEST_KEYS);
    },
    encodedFormId() {
      return encodeURIComponent(this.xmlFormId);
    },
    tabPathPrefix() {
      return `/projects/${this.projectId}/forms/${this.encodedFormId}`;
    },
    rendersMediaFilesTab() {
      return this.canRoute(this.tabPath('media-files')) &&
        this.attachments != null && this.attachments.length !== 0;
    },
    missingAttachmentCount() {
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
      this.$store.dispatch('get', [
        {
          key: 'form',
          url: `/projects/${this.projectId}/forms/${this.encodedFormId}`,
          extended: true,
          success: ({ submissionsChunk }) => {
            if (submissionsChunk == null) return;
            if (submissionsChunk['@odata.count'] === this.form.submissions)
              return;
            this.$store.commit('setData', {
              key: 'form',
              value: this.form.with({
                submissions: submissionsChunk['@odata.count']
              })
            });
          }
        },
        {
          key: 'attachments',
          url: `/projects/${this.projectId}/forms/${this.encodedFormId}/attachments`,
          extended: true
        }
      ]).catch(noop);
    }
  }
};
</script>
