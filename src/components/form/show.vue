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
import { DateTime } from 'luxon';

import FormHead from './head.vue';
import Loading from '../loading.vue';
import Option from '../../util/option';
import PageBody from '../page/body.vue';
import callWait from '../../mixins/call-wait';
import reconcileData from '../../store/modules/request/reconcile';
import request from '../../mixins/request';
import routes from '../../mixins/routes';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';

reconcileData.add(
  'form', 'formDraft',
  (form, formDraft, commit) => {
    // Note the unlikely possibility that
    // form.publishedAt == null && formDraft.isEmpty(). In that case,
    // the user will be redirected to /.
    if (form.publishedAt == null && formDraft.isDefined()) {
      const { enketoId } = formDraft.get();
      if (form.enketoId !== enketoId) {
        commit('setData', {
          key: 'form',
          value: form.with({ enketoId })
        });
      }
    }
  }
);
reconcileData.add(
  'formDraft', 'attachments',
  (formDraft, attachments, commit) => {
    if (formDraft.isDefined() && attachments.isEmpty())
      commit('setData', { key: 'formDraft', value: Option.none() });
    else if (formDraft.isEmpty() && attachments.isDefined())
      commit('setData', { key: 'attachments', value: Option.none() });
  }
);

const REQUEST_KEYS = ['project', 'form', 'formDraft', 'attachments'];

export default {
  name: 'FormShow',
  components: { FormHead, Loading, PageBody },
  mixins: [callWait(), request(), routes()],
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
      calls: {},
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
    fetchEnketoId(callName, requestKey, url) {
      this.callWait(
        callName,
        () => new Promise((resolve, reject) => {
          this.$store.dispatch('get', [{
            key: requestKey,
            url,
            update: ['enketoId'],
            success: (data) => {
              resolve(Option.of(data[requestKey]).get().enketoId != null);
            },
            alert: false
          }]).catch(reject);
        }),
        // Wait for up to a total of 10 minutes, not including request time.
        (tries) => {
          if (tries < 20) return 3000;
          if (tries < 50) return 8000;
          if (tries < 70) return 15000;
          return null;
        }
      );
    },
    fetchForm() {
      this.cancelCall('fetchEnketoIdForForm');
      const url = apiPaths.form(this.projectId, this.xmlFormId);
      this.$store.dispatch('get', [{
        key: 'form',
        url,
        extended: true,
        success: ({ form }) => {
          if (form.enketoId != null) return;
          const { publishedAt } = form;
          // The enketoId of a form without a published version is the same as
          // the enketoId of the form draft. If a form without a published
          // version does not have an enketoId, we do not fetch its enketoId,
          // because we will already fetch the enketoId of the draft.
          if (publishedAt == null) return;
          // If Enketo hasn't finished processing the form in 15 minutes,
          // something else has probably gone wrong.
          if (Date.now() - DateTime.fromISO(publishedAt).toMillis() > 900000)
            return;
          this.fetchEnketoId('fetchEnketoIdForForm', 'form', url);
        }
      }]).catch(noop);
    },
    fetchDraft() {
      this.cancelCall('fetchEnketoIdForDraft');
      const draftUrl = apiPaths.formDraft(this.projectId, this.xmlFormId);
      this.$store.dispatch('get', [
        {
          key: 'formDraft',
          url: draftUrl,
          extended: true,
          fulfillProblem: ({ code }) => code === 404.1,
          success: ({ formDraft }) => {
            formDraft.ifDefined(({ enketoId }) => {
              if (enketoId == null) {
                // We do not check that the form draft has not changed, for
                // example, by another user concurrently modifying the draft.
                this.fetchEnketoId('fetchEnketoIdForDraft', 'formDraft', draftUrl);
              }
            });
          }
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
