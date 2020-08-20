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
  <div :class="htmlClass">
    <span class="icon-check-circle"></span>
    <p class="heading"><slot name="title"></slot></p>
    <slot></slot>
  </div>
</template>

<script>
export default {
  name: 'ChecklistStep',
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
      required: true
    }
  },
  computed: {
    htmlClass() {
      return ['checklist-step', `checklist-step-${this.stage}`];
    }
  }
};
</script>

<style lang="scss">
@import '../assets/scss/variables';

.checklist-step {
  margin-bottom: 20px;
  position: relative;

  .icon-check-circle {
    position: absolute;
    font-size: 17px;
  }

  p {
    margin-left: 21px;
    line-height: 17px;
  }

  .heading {
    font-weight: bold;
    margin-bottom: 5px;
  }
}

.checklist-step-later {
  .icon-check-circle, .heading { color: #ccc; }
}

.checklist-step-current {
  .icon-check-circle { color: #ccc; }
}

.checklist-step-complete {
  .icon-check-circle, .heading { color: $color-success; }
}
</style>
