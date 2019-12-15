<!--
Copyright 2019 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/opendatakit/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <button id="form-preview-button" type="button" class="btn btn-primary"
    :disabled="disabled || awaitingResponse" @click="openPreview">
    <span class="icon-eye"></span>Preview<spinner :state="awaitingResponse"/>
  </button>
</template>

<script>
import request from '../../../../mixins/request';

export default {
  name: 'FormPreviewButton',
  mixins: [request()],
  props: {
    previewPath: {
      type: String,
      required: true
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      awaitingResponse: false,
      previewWindow: null
    };
  },
  methods: {
    openPreview() {
      // 😞 Open the window in advance to avoid angering pop-up blockers (e.g. Firefox 70's)
      this.previewWindow = window.open('');
      this.post(this.previewPath)
        .then(response => {
          let previewUrl;
          try {
            previewUrl = response.data.preview_url;
            // Is the preview URL valid? If not, don't let the user stare at a blank screen forever.
            // The resulting URL object is intentionally discarded.
            new URL(previewUrl); // eslint-disable-line no-new
          } catch (e) {
            this.$alert().danger('Something went wrong while trying to load the preview.');
            throw e;
          }
          this.previewWindow.location.replace(response.data.preview_url);
          this.$alert().blank();
        })
        .catch(() => {
          this.previewWindow.close();
        });
    }
  }
};
</script>
