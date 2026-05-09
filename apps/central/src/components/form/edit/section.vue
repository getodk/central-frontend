<!--
Copyright 2025 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div class="form-edit-section">
    <div>
      <div class="form-edit-section-icon-container">
        <span :class="`icon-${icon}`"></span>
        <span v-if="warning" class="icon-warning"></span>
      </div>
      <div v-if="dotted" class="form-edit-section-dots"></div>
    </div>
    <div>
      <div class="form-edit-section-heading">
        <div>
          <p class="form-edit-section-title"><slot name="title"></slot></p>
          <p class="form-edit-section-subtitle"><slot name="subtitle"></slot></p>
        </div>
        <div class="form-edit-section-tag">
          <span class="icon-circle"></span>
          <span><slot name="tag"></slot></span>
        </div>
      </div>
      <div class="form-edit-section-body"><slot name="body"></slot></div>
    </div>
  </div>
</template>

<script setup>
defineOptions({
  name: 'FormEditSection'
});
defineProps({
  icon: {
    type: String,
    required: true
  },
  // `true` to show dots down the lefthand side of the section. To adjust the
  // number of dots, adjust the bottom margin of .form-edit-section-body from
  // the parent component.
  dotted: Boolean,
  warning: Boolean
});
</script>

<style lang="scss">
@import '../../../assets/scss/mixins';

/*
We add $margin-bottom to both .form-edit-section-icon-container and
.form-edit-section-body because it's not clear which one will be taller. We want
a consistent amount of margin after the section.

We don't just add $margin-bottom to the section as a whole because that would
stack on the bottom margin of whatever is passed to the `body` slot. Adding
$margin-bottom to .form-edit-section-body allows us to benefit from margin
collapse.
*/
$margin-bottom: 35px;
$heading-margin-bottom: 10px;

.form-edit-section {
  column-gap: 15px;
  display: flex;

  > :first-child {
    align-items: center;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
  }

  > :nth-child(2) {
    flex-grow: 1;
    overflow-x: hidden;
    padding-top: 6px;
  }
}

.form-edit-section-icon-container {
  @include icon-box;
  font-size: 24px;
  padding-inline: 0;
  // 44px = 10px of padding on the left and right + 24px for the icon. The width
  // of the icon varies significantly, but the height of the icon is a
  // consistent 24px. If the icon is wider than 24px, that will just eat into
  // the padding.
  width: 44px;
  height: 44px;

  // Use flexbox to center the icon.
  display: flex;
  align-items: center;
  justify-content: center;

  flex-shrink: 0;
  position: relative;

  &:last-child { margin-bottom: $margin-bottom; }
}

.form-edit-section-dots {
  border-left: 2px dotted #999;
  height: 100%;
  margin-block: 9px;
}

.form-edit-section-heading {
  align-items: center;
  column-gap: 15px;
  display: flex;
  margin-bottom: $heading-margin-bottom;
}

.form-edit-section-title {
  font-size: 16px;
  font-weight: bold;
  line-height: 1.2;
  margin-bottom: 0;
}

.form-edit-section-subtitle {
  margin-bottom: 0;

  &:empty { display: none; }
}

.form-edit-section-tag {
  display: flex;
  align-items: center;
  column-gap: $margin-right-icon;

  background-color: rgba($color-accent-primary, 0.04);
  border-radius: 6px;
  color: $color-accent-primary;
  padding: 5px 9px;

  // Hide the entire element if no tag slot is provided. We don't want the icon
  // to be shown in that case.
  &:has(> :nth-child(2):empty) { display: none; }

  .icon-circle { font-size: 12px; }
}

.form-edit-section-body {
  margin-bottom: $margin-bottom;
  &:has(.form-edit-section) { margin-bottom: 0; }
}

.form-edit-section:has(.form-edit-section-subtitle:empty) .form-edit-section-body > p:first-of-type {
  margin-top: -$heading-margin-bottom;
}

.form-edit-section-icon-container .icon-warning:nth-child(2) {
  position: absolute;
  right: -9px;
  bottom: -3px;

  color: $color-danger;
  font-size: 16px;
}
</style>
