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
    <form-head @fetch-draft="fetchDraft"/>
    <page-body>
      <loading :state="initiallyLoading"/>
      <div v-show="dataExists">
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
import Option from '../../util/option';
import PageBody from '../page/body.vue';
import reconcileData from '../../store/modules/request/reconcile';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';

const REQUEST_KEYS = ['project', 'form', 'formDraft', 'attachments'];

export default {
  name: 'FormShow',
  components: { FormHead, Loading, PageBody },
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
    const deactivate = reconcileData.add(
      'formDraft', 'attachments',
      (formDraft, attachments) => {
        if (formDraft.isDefined() && attachments.isEmpty()) {
          this.$store.commit('setData', {
            key: 'formDraft',
            value: Option.none()
          });
        } else if (formDraft.isEmpty() && attachments.isDefined()) {
          this.$store.commit('setData', {
            key: 'attachments',
            value: Option.none()
          });
        }
      }
    );
    this.$once('hook:beforeDestroy', deactivate);
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
    }
  }
};
</script>
