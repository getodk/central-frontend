<!--
Copyright 2021 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <modal id="submission-update-review-state" :state="state"
    :hideable="!awaitingResponse" backdrop @hide="$emit('hide')"
    @shown="$refs.form.querySelector('input:checked').focus()">
    <template #title>{{ $t('title') }}</template>
    <template #body>
      <form ref="form" @submit.prevent="submit">
        <div class="row">
          <div class="col-xs-4">
            <div class="radio">
              <label>
                <input v-model="reviewState" type="radio" value="approved">
                <span class="icon-check-circle"></span>{{ $t('reviewState.approved') }}
              </label>
              <label>
                <input v-model="reviewState" type="radio" value="hasIssues">
                <span class="icon-comments"></span>{{ $t('reviewState.hasIssues') }}
              </label>
              <label>
                <input v-model="reviewState" type="radio" value="rejected">
                <span class="icon-times-circle"></span>{{ $t('reviewState.rejected') }}
              </label>
            </div>
          </div>
          <div class="col-xs-8">
            <label class="form-group">
              <textarea v-model.trim="notes" class="form-control"
                :placeholder="$t('field.notes')" rows="3">
              </textarea>
              <span class="form-label">{{ $t('field.notes') }}</span>
            </label>
          </div>
        </div>
        <div class="modal-actions">
          <button type="submit" class="btn btn-primary"
            :disabled="awaitingResponse">
            {{ $t('action.update') }} <spinner :state="awaitingResponse"/>
          </button>
          <button type="button" class="btn btn-link"
            :disabled="awaitingResponse" @click="$emit('hide')">
            {{ $t('action.neverMind') }}
          </button>
        </div>
      </form>
    </template>
  </modal>
</template>

<script>
import Modal from '../modal.vue';
import Spinner from '../spinner.vue';

import request from '../../mixins/request';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
import { requestData } from '../../store/modules/request';

export default {
  name: 'SubmissionUpdateReviewState',
  components: { Modal, Spinner },
  mixins: [request()],
  props: {
    state: Boolean,
    projectId: {
      type: String,
      required: true
    },
    xmlFormId: {
      type: String,
      required: true
    },
    instanceId: {
      type: String,
      required: true
    }
  },
  data() {
    const { reviewState } = this.$store.state.request.data.submission.__system;
    return {
      awaitingResponse: false,
      reviewState: reviewState == null || reviewState === 'edited'
        ? 'approved'
        : reviewState,
      notes: ''
    };
  },
  // The component assumes that this data will exist when the component is
  // created.
  computed: requestData(['submission']),
  watch: {
    state(state) {
      if (!state) {
        const { reviewState } = this.submission.__system;
        this.reviewState = reviewState == null || reviewState === 'edited'
          ? 'approved'
          : reviewState;
        this.notes = '';
      }
    }
  },
  methods: {
    submit() {
      const headers = {};
      if (this.notes !== '')
        headers['X-Action-Notes'] = encodeURIComponent(this.notes);
      this.request({
        method: 'PATCH',
        url: apiPaths.submission(
          this.projectId,
          this.xmlFormId,
          this.instanceId
        ),
        data: { reviewState: this.reviewState },
        headers
      })
        .then(() => {
          this.$emit('success', this.reviewState);
        })
        .catch(noop);
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#submission-update-review-state {
  .radio, .form-group { margin-bottom: 0; }
  .radio { margin-top: 0; }

  $margin-left-icon: 2px;
  .icon-comments {
    margin-left: $margin-left-icon;
    margin-right: $margin-right-icon;
  }
  .icon-check-circle, .icon-times-circle {
    margin-left: #{$margin-left-icon + 1px};
    margin-right: #{$margin-right-icon + 1px};
  }

  .icon-check-circle { color: $color-success; }
  .icon-comments { color: $color-warning; }
  .icon-times-circle { color: $color-danger; }
}
</style>

<i18n lang="json5">
{
  "en": {
    // This is the title at the top of a pop-up.
    "title": "Update Review State",
    "field": {
      "notes": "Notes and comments (optional)"
    }
  }
}
</i18n>
