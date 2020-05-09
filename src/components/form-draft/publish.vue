<!--
Copyright 2020 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <modal id="form-draft-publish" :state="state" :hideable="!awaitingResponse"
    backdrop @shown="focusInput" @hide="$emit('hide')">
    <template #title>Publish Draft</template>
    <template #body>
      <div v-if="rendersAttachmentsWarning || rendersTestingWarning"
        class="modal-warnings">
        <ul>
          <li v-if="rendersAttachmentsWarning">
            You have not provided all the
            <router-link :to="formPath('draft/attachments')">Media Files</router-link>
            that your Form requires. You can ignore this if you wish, but you
            will need to make a new Draft version to upload those files later.
          </li>
          <li v-if="rendersTestingWarning">
            You have not yet
            <router-link :to="formPath('draft/testing')">tested this Form</router-link>
            on a mobile device and uploaded a test Submission. You do not have
            to do this, but it is highly recommended.
          </li>
        </ul>
      </div>
      <div class="modal-introduction">
        <p>
          You are about to make this Draft the published version of your Form.
          This will finalize any changes you have made to the Form definition
          and its attached Media Files.
        </p>
        <p>
          Existing Form Submissions will be unaffected, but all Draft test
          Submissions will be removed.
        </p>
        <p v-if="draftVersionStringIsDuplicate">
          Every version of a Form requires a unique version name. Right now,
          your Draft Form has the same version name as a previously published
          version. You can set a new one by uploading a Form definition with
          your desired name, or you can type a new one below and I will change
          it for you.
        </p>
      </div>
      <form v-if="draftVersionStringIsDuplicate" @submit.prevent="publish">
        <form-group ref="versionString" v-model.trim="versionString"
          placeholder="Version" required autocomplete="off"/>
        <!-- We specify two nearly identical .modal-actions, because here we
        want the Proceed button to be a submit button (which means that browsers
        will do some basic form validation when it is clicked). -->
        <div class="modal-actions">
          <button type="submit" class="btn btn-primary"
            :disabled="awaitingResponse">
            Proceed <spinner :state="awaitingResponse"/>
          </button>
          <button type="button" class="btn btn-link"
            :disabled="awaitingResponse" @click="$emit('hide')">
            Cancel
          </button>
        </div>
      </form>
      <div v-else class="modal-actions">
        <button type="button" class="btn btn-primary"
          :disabled="awaitingResponse" @click="publish">
          Proceed <spinner :state="awaitingResponse"/>
        </button>
        <button type="button" class="btn btn-link" :disabled="awaitingResponse"
          @click="$emit('hide')">
          Cancel
        </button>
      </div>
    </template>
  </modal>
</template>

<script>
import { mapGetters } from 'vuex';

import FormGroup from '../form-group.vue';
import Modal from '../modal.vue';
import Spinner from '../spinner.vue';
import request from '../../mixins/request';
import routes from '../../mixins/routes';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
import { requestData } from '../../store/modules/request';

export default {
  name: 'FormDraftPublish',
  components: { FormGroup, Modal, Spinner },
  mixins: [request(), routes()],
  props: {
    state: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      awaitingResponse: false,
      versionString: ''
    };
  },
  computed: {
    // The component does not assume that this data will exist when the
    // component is created.
    ...requestData([
      'formVersions',
      { key: 'formDraft', getOption: true },
      'attachments'
    ]),
    ...mapGetters(['missingAttachmentCount']),
    draftVersionStringIsDuplicate() {
      if (this.formVersions == null || this.formDraft == null) return false;
      return this.formVersions.some(version =>
        version.version === this.formDraft.version);
    },
    rendersAttachmentsWarning() {
      return this.attachments != null && this.missingAttachmentCount !== 0;
    },
    rendersTestingWarning() {
      return this.formDraft != null && this.formDraft.submissions === 0;
    }
  },
  watch: {
    state(state) {
      if (state) this.versionString = this.formDraft.version;
    }
  },
  methods: {
    focusInput() {
      if (this.draftVersionStringIsDuplicate) this.$refs.versionString.focus();
    },
    publish() {
      this.request({
        method: 'POST',
        url: apiPaths.publishFormDraft(
          this.formDraft.projectId,
          this.formDraft.xmlFormId,
          this.versionString !== this.formDraft.version
            ? { version: this.versionString }
            : null
        )
      })
        .then(() => {
          this.$emit('success');
        })
        .catch(noop);
    }
  }
};
</script>
