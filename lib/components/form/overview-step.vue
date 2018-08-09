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
    <div class="form-overview-step">
      <p :class="headingClass">
        <span :class="iconClass"></span><slot name="title"></slot>
      </p>
      <slot></slot>
    </div>
    <hr v-if="!last">
  </div>
</template>

<script>
export default {
  name: 'FormOverviewStep',
  props: {
    stage: {
      type: String,
      default: 'later'
    },
    last: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    headingClass() {
      const textClass = {
        'text-muted': this.stage === 'later',
        'text-success': this.stage === 'complete'
      };
      return ['form-overview-step-heading', textClass];
    },
    iconClass() {
      return ['icon-check-circle', { 'text-muted': this.stage !== 'complete' }];
    }
  }
};
</script>

<style lang="sass">
.form-overview-step {
  p {
    margin-left: 21px;
    line-height: 17px;
    max-width: 565px;
  }

  .form-overview-step-heading {
    font-weight: bold;
    margin-left: 0;
    margin-bottom: 5px;

    .icon-check-circle {
      display: inline-block;
      font-size: 17px;
      vertical-align: -2px;
      width: 21px;
    }
  }
}
</style>
