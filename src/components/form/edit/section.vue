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
  <div class="form-edit-section" :class="{ warning }">
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
  dotted: Boolean,
  warning: Boolean
});
</script>

<style lang="scss">
@import '../../../assets/scss/variables';

$dots-margin-block: 9px;
$heading-margin-bottom: 10px;

.form-edit-section {
  column-gap: 15px;
  display: flex;
  margin-bottom: $dots-margin-block;

  > :first-child {
    align-items: center;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
  }

  > :nth-child(2) {
    flex-grow: 1;
    overflow-x: hidden;
    padding-top: 16px;
  }
}

.form-edit-section-icon-container {
  // Use flexbox to center the icon.
  display: flex;
  align-items: center;
  justify-content: center;

  $radius: 36px;
  width: #{2 * $radius};
  height: #{2 * $radius};
  border-radius: $radius;
  background-color: #eee;

  flex-shrink: 0;
  font-size: 35px;
  position: relative;
}

.form-edit-section-dots {
  border-left: 2px dotted #999;
  height: 100%;
  margin-top: $dots-margin-block;
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
  font-size: 12px;
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

.form-edit-section:has(.form-edit-section-subtitle:empty) .form-edit-section-body > p:first-of-type {
  margin-top: -$heading-margin-bottom;
}

.form-edit-section.warning {
  .form-edit-section-icon-container { background-color: $color-warning-light; }
}
.form-edit-section-icon-container .icon-warning:nth-child(2) {
  position: absolute;
  right: 2px;
  bottom: 7px;

  font-size: 18px;
}
</style>
