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
  <modal id="field-key-new" :state="state" :hideable="!awaitingResponse"
    backdrop @hide="hideOrComplete" @shown="focusNicknameInput">
    <template #title>Create App User</template>
    <template #body>
      <template v-if="step === 1">
        <p class="modal-introduction">
          This user will not have access to any Forms at first. You will be able
          to assign Forms after the user is created.
        </p>
        <form @submit.prevent="submit">
          <label class="form-group">
            <input ref="nickname" v-model.trim="nickname"
              :disabled="awaitingResponse" class="form-control"
              placeholder="Nickname *" required>
            <span class="form-label">Nickname *</span>
          </label>
          <div class="modal-actions">
            <button :disabled="awaitingResponse" type="submit"
              class="btn btn-primary">
              Create <spinner :state="awaitingResponse"/>
            </button>
            <button :disabled="awaitingResponse" type="button"
              class="btn btn-link" @click="hideOrComplete">
              Cancel
            </button>
          </div>
        </form>
      </template>
      <template v-else>
        <div class="modal-introduction step-2">
          <p>
            <span class="icon-check-circle"></span><strong>Success!</strong>
            The App User &ldquo;{{ created.displayName }}&rdquo; has been
            created.
          </p>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <p v-html="created.qrCodeHtml()"></p>
          <p>
            You can configure a mobile device for
            &ldquo;{{ created.displayName }}&rdquo; right now by
            <doc-link to="collect-import-export/">scanning the code above</doc-link>
            into their app. Or you can do it later from the App Users table by
            clicking &ldquo;See code.&rdquo;
          </p>
          <p>
            You may wish to visit this Project&rsquo;s
            <a href="#" @click="navigateToFormAccess">Form Access settings</a>
            to give this user access to Forms.
          </p>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-primary" @click="complete">
            Done
          </button>
          <button type="button" class="btn btn-link" @click="createAnother">
            Create another
          </button>
        </div>
      </template>
    </template>
  </modal>
</template>

<script>
import DocLink from '../doc-link.vue';
import FieldKey from '../../presenters/field-key';
import request from '../../mixins/request';
import { noop } from '../../util/util';
import { requestData } from '../../store/modules/request';

export default {
  name: 'FieldKeyNew',
  components: { DocLink },
  mixins: [request()],
  props: {
    state: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      awaitingResponse: false,
      // There are two steps/screens in the app user creation process. `step`
      // indicates the current step. Note that it is 1-indexed.
      step: 1,
      nickname: '',
      created: null
    };
  },
  computed: requestData(['project']),
  watch: {
    state(state) {
      if (state) return;
      this.step = 1;
      this.nickname = '';
      this.created = null;
    }
  },
  methods: {
    focusNicknameInput() {
      this.$refs.nickname.focus();
    },
    submit() {
      const path = `/projects/${this.project.id}/app-users`;
      this.post(path, { displayName: this.nickname })
        .then(({ data }) => {
          // Reset the form.
          this.$alert().blank();
          this.nickname = '';

          this.step = 2;
          this.created = new FieldKey(this.project.id, data);
        })
        .catch(noop);
    },
    complete() {
      this.$emit('success', this.created);
    },
    hideOrComplete() {
      if (this.created == null)
        this.$emit('hide');
      else
        this.complete();
    },
    navigateToFormAccess() {
      // Clear fieldKeys so that the Form Access tab will fetch it again.
      this.$store.commit('clearData', 'fieldKeys');
      this.$router.push(`/projects/${this.project.id}/form-access`);
    },
    createAnother() {
      this.step = 1;
      // We do not reset this.created, because it will still be used once the
      // modal is hidden.
      this.$nextTick(this.focusNicknameInput);
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#field-key-new .modal-introduction.step-2 {
  text-align: center;

  .icon-check-circle {
    color: $color-success;
    font-size: 32px;
    margin-right: 6px;
    vertical-align: middle;
  }

  img {
    margin-top: -5px;
    margin-bottom: 20px;
  }
}
</style>
