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
  <form id="submission-comment" @submit.prevent="submit">
    <div v-if="editWithoutComment" role="alert">
      <span class="icon-pencil"></span>{{ $t('editWithoutComment') }}
    </div>
    <div class="form-group">
      <textarea v-model.trim="body" class="form-control"
        :placeholder="$t('field.comment')" :aria-label="$t('field.comment')"
        required rows="2">
      </textarea>
    </div>
    <div v-show="body !== '' || awaitingResponse || editWithoutComment"
      id="submission-comment-actions">
      <button type="submit" class="btn btn-primary"
        :disabled="awaitingResponse">
        {{ $t('action.comment') }} <spinner :state="awaitingResponse"/>
      </button>
    </div>
  </form>
</template>

<script>
import Spinner from '../spinner.vue';

import request from '../../mixins/request';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
import { requestData } from '../../store/modules/request';

export default {
  name: 'SubmissionComment',
  components: { Spinner },
  mixins: [request()],
  props: {
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
    },
    feed: Array
  },
  data() {
    return {
      awaitingResponse: false,
      body: ''
    };
  },
  computed: {
    ...requestData(['currentUser']),
    editWithoutComment() {
      if (this.feed == null) return false;
      for (const entry of this.feed) {
        if (entry.actorId === this.currentUser.id) {
          if (entry.body != null) return false;
          if (entry.action === 'submission.update.version') return true;
        }
      }
      return false;
    }
  },
  methods: {
    submit() {
      this.request({
        method: 'POST',
        url: apiPaths.submissionComments(
          this.projectId,
          this.xmlFormId,
          this.instanceId
        ),
        data: { body: this.body }
      })
        .then(() => {
          this.$emit('success');
          this.body = '';
        })
        .catch(noop);
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/mixins';

#submission-comment {
  margin-bottom: 15px;

  [role="alert"] {
    background-color: $color-action-foreground;
    color: #fff;
    font-size: 18px;
    padding: 15px;

    .icon-pencil { margin-right: 10px; }
  }

  .form-group {
    margin-bottom: 0;
    padding-bottom: 5px;
  }

  textarea {
    border-bottom-color: #aaa;
  }

  .btn { float: right; }
}

#submission-comment-actions {
  @include clearfix;
  margin-top: 5px;
}
</style>

<i18n lang="json5">
{
  "en": {
    "editWithoutComment": "You have made edits to this data. Please describe the changes you made."
  }
}
</i18n>
