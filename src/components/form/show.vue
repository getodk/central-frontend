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
import { requestData } from '../../store/modules/request';

reconcileData.add(
  'form', 'formDraft',
  (form, formDraft, commit) => {
    if (form.publishedAt == null) {
      if (formDraft.isEmpty()) {
        if (form.enketoId != null) {
          commit('setData', {
            key: 'form',
            value: form.with({ enketoId: null })
          });
        }
      } else {
        const { enketoId } = formDraft.get();
        if (form.enketoId !== enketoId) {
          commit('setData', {
            key: 'form',
            value: form.with({ enketoId })
          });
        }
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
/* If the form does not have an enketoId, we wait, then send a second request
for the form in order to check for an enketoId. We store the entire form from
the second request, not just its enketoId, because we also check that the form
from the second request matches the form from the first. We only update
enketoId, not other properties, because updating other properties could result
in more complexity / unexpected behavior. */
reconcileData.add(
  'form', 'formWithEnketoId',
  (form, formWithEnketoId, commit) => {
    if (form.enketoId == null && formWithEnketoId.enketoId != null) {
      commit('setData', {
        key: 'form',
        value: form.with({ enketoId: formWithEnketoId.enketoId })
      });
    }
  }
);
reconcileData.add(
  'formDraft', 'draftWithEnketoId',
  (draftOption, draftWithEnketoId, commit) => {
    if (draftOption.isEmpty()) {
      commit('clearData', 'draftWithEnketoId');
      return;
    }
    const formDraft = draftOption.get();
    if (draftWithEnketoId.version !== formDraft.version ||
      // A new draft could have been uploaded with the same version, so we also
      // check sha256.
      draftWithEnketoId.sha256 !== formDraft.sha256) {
      commit('clearData', 'draftWithEnketoId');
    } else if (formDraft.enketoId == null &&
      draftWithEnketoId.enketoId != null) {
      commit('setData', {
        key: 'formDraft',
        value: Option.of(formDraft.with({
          enketoId: draftWithEnketoId.enketoId
        }))
      });
    }
  }
);
reconcileData.add(
  'form', 'draftWithEnketoId',
  (form, draftWithEnketoId, commit) => {
    if (form.publishedAt == null && form.enketoId == null &&
      draftWithEnketoId.enketoId != null) {
      commit('setData', {
        key: 'form',
        value: form.with({ enketoId: draftWithEnketoId.enketoId })
      });
    }
  }
);
// We do not reconcile `formVersions` and `form` (for example, form.version).

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
    ...requestData(['formWithEnketoId', 'draftWithEnketoId']),
    initiallyLoading() {
      return this.$store.getters.initiallyLoading([
        'project',
        'form',
        'formDraft',
        'attachments'
      ]);
    },
    dataExists() {
      return this.$store.getters.dataExists([
        'project',
        'form',
        'formDraft',
        'attachments'
      ]);
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
    fetchEnketoId(key, url) {
      this.callWait(
        key,
        () => new Promise((resolve, reject) => {
          this.$store.dispatch('get', [{
            key,
            url,
            success: ({ [key]: versionWithEnketoId }) => {
              // Cleared during reconciliation
              const invalid = versionWithEnketoId == null;
              // We no longer need to store the data.
              if (!invalid) this.$store.commit('clearData', key);
              resolve(invalid || versionWithEnketoId.enketoId != null);
            },
            alert: false
          }]).catch(reject);
        }),
        // Wait for up to a total of about 3 minutes, not including request
        // time.
        (tries) => {
          if (tries < 6) return 1000;
          if (tries < 24) return 3000;
          if (tries < 40) return 8000;
          return null;
        }
      );
    },
    fetchForm() {
      if (this.formWithEnketoId != null)
        this.$store.commit('clearData', 'formWithEnketoId');
      this.$store.commit('cancelRequest', 'formWithEnketoId');
      this.cancelCall('formWithEnketoId');

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
          this.fetchEnketoId('formWithEnketoId', url);
        }
      }]).catch(noop);
    },
    fetchDraft() {
      // Clear this.draftWithEnketoId so that it is not reconciled with the
      // form.
      if (this.draftWithEnketoId != null)
        this.commit('clearData', 'draftWithEnketoId');
      this.$store.commit('cancelRequest', 'draftWithEnketoId');
      this.cancelCall('draftWithEnketoId');

      const draftUrl = apiPaths.formDraft(this.projectId, this.xmlFormId);
      this.$store.dispatch('get', [
        {
          key: 'formDraft',
          url: draftUrl,
          extended: true,
          fulfillProblem: ({ code }) => code === 404.1,
          success: ({ formDraft }) => {
            formDraft.ifDefined(({ enketoId }) => {
              if (enketoId == null)
                this.fetchEnketoId('draftWithEnketoId', draftUrl);
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
