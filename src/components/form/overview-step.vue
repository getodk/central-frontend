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
    <div :class="htmlClass">
      <p class="form-overview-step-heading">
        <span class="icon-check-circle"></span><slot name="title"></slot>
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
    /*
    `stage` is one of three values:

      - 'later'. The step is later than the current step: the user has not yet
        reached the step.
      - 'current'. The step is the current step.
      - 'complete'. The step is complete.
    */
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
    htmlClass() {
      return ['form-overview-step', `form-overview-step-${this.stage}`];
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

.form-overview-step {
  p {
    margin-left: 21px;
    line-height: 17px;
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

.form-overview-step-later .form-overview-step-heading {
  color: #999;
}

.form-overview-step-current .form-overview-step-heading {
  .icon-check-circle {
    color: #999;
  }
}

.form-overview-step-complete .form-overview-step-heading {
  color: $color-success;
}
</style>
