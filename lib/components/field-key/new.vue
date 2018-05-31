<!--
Copyright 2017 Super Adventure Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/nafundi/super-adventure/blob/master/NOTICE.

This file is part of Super Adventure. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of Super Adventure,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <modal id="field-key-new" ref="modal" :state="state"
    :hideable="!awaitingResponse" backdrop @hide="hideOrComplete"
    @shown="focusNicknameInput">
    <template slot="title">Create App User</template>
    <template slot="body">
      <template v-if="step === 1">
        <alert v-bind="alert" @close="alert.state = false"/>
        <form @submit.prevent="submit">
          <label class="form-group">
            <select :disabled="awaitingResponse" class="form-control">
              <option>Download and submit to all forms on this server</option>
              <option disabled>
                More options available soon (to choose particular forms)
              </option>
            </select>
            <span class="form-label">Access *</span>
          </label>
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
              Close
            </button>
          </div>
        </form>
      </template>
      <template v-else>
        <div class="modal-introduction text-center">
          <div>
            <span class="icon-check-circle text-success"></span>
            <strong>Success!</strong> The app user “{{ created.displayName }}”
            has been created.
          </div>
          <div v-html="created.qrCodeHtml()"></div>
          <div>
            You can configure a mobile device for “{{ created.displayName }}”
            right now by
            <doc-link to="collect-import-export/">scanning the code above</doc-link>
            into their app. Or you can do it later from the App Users table by
            clicking “See code.”
          </div>
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
import FieldKey from '../../presenters/field-key';
import alert from '../../mixins/alert';
import request from '../../mixins/request';

export default {
  name: 'FieldKeyNew',
  mixins: [alert(), request()],
  props: {
    state: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      alert: alert.blank(),
      requestId: null,
      // There are two steps/screens in the app user creation process. `step`
      // indicates the current step. Note that it is 1-indexed.
      step: 1,
      nickname: '',
      created: null
    };
  },
  methods: {
    focusNicknameInput() {
      this.$refs.nickname.focus();
    },
    submit() {
      this
        .post('/field-keys', { displayName: this.nickname })
        .then(({ data }) => {
          // Reset the form.
          this.alert = alert.blank();
          this.nickname = '';

          this.step = 2;
          this.created = new FieldKey(data);
        })
        .catch(() => {});
    },
    complete() {
      this.$emit('hide');
      this.$emit('success', this.created);
      this.step = 1;
      this.created = null;
    },
    hideOrComplete() {
      if (this.created == null)
        this.$emit('hide');
      else
        this.complete();
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

<style lang="sass">
#field-key-new .modal-introduction {
  .icon-check-circle {
    font-size: 32px;
    vertical-align: middle;
  }

  img {
    margin-top: 5px;
    margin-bottom: 20px;
  }
}
</style>
