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
  <modal id="field-key-new" :state="state" :hideable="!awaitingResponse"
    backdrop @hide="hideOrComplete" @shown="focusInput">
    <template #title>{{ $t('title') }}</template>
    <template #body>
      <template v-if="step === 0">
        <p class="modal-introduction">{{ $t('introduction[0]') }}</p>
        <form @submit.prevent="submit">
          <form-group ref="displayName" v-model.trim="displayName"
            :placeholder="$t('field.displayName')" required autocomplete="off"/>
          <div class="modal-actions">
            <button type="submit" class="btn btn-primary"
              :disabled="awaitingResponse">
              {{ $t('action.create') }} <spinner :state="awaitingResponse"/>
            </button>
            <button type="button" class="btn btn-link"
              :disabled="awaitingResponse" @click="hideOrComplete">
              {{ $t('action.cancel') }}
            </button>
          </div>
        </form>
      </template>
      <template v-else>
        <div id="field-key-new-success" class="modal-introduction">
          <p>
            <span class="icon-check-circle"></span>
            <strong>{{ $t('common.success') }}</strong>
            {{ $t('success[0]', created) }}
          </p>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <p v-html="created.qrCodeHtml()"></p>
          <i18n tag="p" path="success[1].full">
            <template #displayName>{{ created.displayName }}</template>
            <template #scanningCode>
              <doc-link to="collect-import-export/">{{ $t('success[1].scanningCode') }}</doc-link>
            </template>
          </i18n>
          <i18n tag="p" path="success[2].full">
            <template #formAccessSettings>
              <a href="#" @click.prevent="navigateToFormAccess">{{ $t('success[2].formAccessSettings') }}</a>
            </template>
          </i18n>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-primary" @click="complete">
            {{ $t('action.done' ) }}
          </button>
          <button type="button" class="btn btn-link" @click="createAnother">
            {{ $t('action.createAnother') }}
          </button>
        </div>
      </template>
    </template>
  </modal>
</template>

<script>
import DocLink from '../doc-link.vue';
import FieldKey from '../../presenters/field-key';
import FormGroup from '../form-group.vue';
import Modal from '../modal.vue';
import Spinner from '../spinner.vue';
import request from '../../mixins/request';
import routes from '../../mixins/routes';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
import { requestData } from '../../store/modules/request';

export default {
  name: 'FieldKeyNew',
  components: { DocLink, FormGroup, Modal, Spinner },
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
      // There are two steps/screens in the app user creation process. `step`
      // indicates the current step.
      step: 0,
      displayName: '',
      created: null
    };
  },
  // The modal assumes that this data will exist when the modal is shown.
  computed: requestData(['project']),
  watch: {
    state(state) {
      if (!state) {
        this.step = 0;
        this.displayName = '';
        this.created = null;
      }
    }
  },
  methods: {
    focusInput() {
      this.$refs.displayName.focus();
    },
    submit() {
      this.request({
        method: 'POST',
        url: apiPaths.fieldKeys(this.project.id),
        data: { displayName: this.displayName }
      })
        .then(({ data }) => {
          // Reset the form.
          this.$alert().blank();
          this.displayName = '';

          this.step = 1;
          this.created = new FieldKey(data);
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
      this.$router.push(this.projectPath('form-access'));
    },
    createAnother() {
      this.step = 0;
      // We do not reset this.created, because it will still be used once the
      // modal is hidden.
      this.$nextTick(this.focusInput);
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#field-key-new-success {
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

<i18n lang="json5">
{
  "en": {
    // This is the title at the top of a pop-up.
    "title": "Create App User",
    "introduction": [
      "This user will not have access to any Forms at first. You will be able to assign Forms after the user is created."
    ],
    "success": [
      "The App User “{displayName}” has been created.",
      {
        "full": "You can configure a mobile device for “{displayName}” right now by {scanningCode} into their app. Or you can do it later from the App Users table by clicking “See code.”",
        "scanningCode": "scanning the code above"
      },
      {
        "full": "You may wish to visit this Project’s {formAccessSettings} to give this user access to Forms.",
        "formAccessSettings": "Form Access settings"
      }
    ],
    "action": {
      // This is the text of a button that is used to create another App User.
      "createAnother": "Create another"
    }
  }
}
</i18n>
