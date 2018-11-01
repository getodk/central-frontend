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
  <page-body v-if="form == null">
    <loading :state="awaitingResponse"/>
  </page-body>
  <div v-else>
    <page-head>
      <template slot="title">{{ form.name || form.xmlFormId }}</template>
      <template slot="tabs">
        <li :class="tabClass('')" role="presentation">
          <router-link :to="tabPath('')">Overview</router-link>
        </li>
        <li v-if="attachments.length !== 0" :class="tabClass('media-files')"
          role="presentation">
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
      <keep-alive>
        <router-view :form="form" :attachments="attachments"
          :chunk-sizes="submissionChunkSizes"
          :scrolled-to-bottom="scrolledToBottom"
          @attachment-change="updateAttachment"
          @update:submissions="updateSubmissions" @state-change="updateState"/>
      </keep-alive>
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
      const headers = { 'X-Extended-Metadata': 'true' };
      this.requestAll([
        this.$http.get(`/forms/${this.xmlFormId}`, { headers }),
        this.$http.get(`/forms/${this.xmlFormId}/attachments`, { headers })
      ])
        .then(([form, attachments]) => {
          this.form = new Form(form.data);
          this.attachments = attachments.data
            .map(attachment => new FormAttachment(attachment));
        })
        .catch(() => {});
    },
    tabPathPrefix() {
      return `/forms/${this.xmlFormId}`;
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
