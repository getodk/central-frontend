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
      <div v-show="dataExists && !awaitingResponse">
        <!-- <router-view> is immediately created and can send its own requests
        even before the server has responded to the requests from ProjectHome
        and FormShow. -->
        <router-view @fetch-form="fetchForm" @fetch-draft="fetchDraft"/>
      </div>
    </page-body>
  </div>
</template>

<script>
import FormHead from './head.vue';
import Loading from '../loading.vue';
import PageBody from '../page/body.vue';
import request from '../../mixins/request';
import routes from '../../mixins/routes';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';

const REQUEST_KEYS = ['project', 'form', 'formDraft', 'attachments'];

export default {
  name: 'FormShow',
  components: { FormHead, Loading, PageBody },
  mixins: [request(), routes()],
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
      awaitingResponse: false
    };
  },
  computed: {
    initiallyLoading() {
      return this.$store.getters.initiallyLoading(REQUEST_KEYS);
    },
    dataExists() {
      return this.$store.getters.dataExists(REQUEST_KEYS);
    }
  },
  watch: {
    projectId: 'fetchData',
    xmlFormId: 'fetchData'
  },
  created() {
    this.fetchData();
  },
  methods: {
    fetchForm() {
      this.$store.dispatch('get', [{
        key: 'form',
        url: apiPaths.form(this.projectId, this.xmlFormId),
        extended: true
      }]).catch(noop);
    },
    fetchDraft() {
      this.$store.dispatch('get', [
        {
          key: 'formDraft',
          url: apiPaths.formDraft(this.projectId, this.xmlFormId),
          extended: true,
          fulfillProblem: ({ code }) => code === 404.1
        },
        {
          key: 'attachments',
          url: apiPaths.formDraftAttachments(this.projectId, this.xmlFormId),
          fulfillProblem: ({ code }) => code === 404.1
        }
      ]).catch(noop);
    },
    fetchData() {
      this.fetchForm();
      this.fetchDraft();
    },
    createDraft() {
      this.post(apiPaths.formDraft(this.projectId, this.xmlFormId))
        .then(() => {
          this.fetchDraft();
          this.$router.push(this.formPath('draft'));
        })
        .catch(noop);
    }
  }
};
</script>
