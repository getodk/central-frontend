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
  <div :class="htmlClass">
    <p class="form-checklist-step-heading">
      <span class="icon-check-circle"></span><slot name="title"></slot>
    </p>
    <slot></slot>
  </div>
</template>

<script>
export default {
  name: 'FormChecklistStep',
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
    }
  },
  computed: {
    htmlClass() {
      return ['form-checklist-step', `form-checklist-step-${this.stage}`];
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

.form-checklist-step {
  margin-bottom: 20px;

  p {
    margin-left: 21px;
    line-height: 17px;
  }

  .form-checklist-step-heading {
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

.form-checklist-step-later .form-checklist-step-heading {
  color: #999;
}

.form-checklist-step-current .form-checklist-step-heading {
  .icon-check-circle {
    color: #999;
  }
}

.form-checklist-step-complete .form-checklist-step-heading {
  color: $color-success;
}
</style>
