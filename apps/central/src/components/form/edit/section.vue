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
  <div class="form-edit-section" :class="{ 'no-border': noBorder }">
    <div class="form-edit-section-heading">
      <div>
        <p class="form-edit-section-title"><slot name="title"></slot></p>
        <p class="form-edit-section-subtitle"><slot name="subtitle"></slot></p>
      </div>
      <div class="form-edit-section-tag">
        <slot name="tag"></slot>
      </div>
      <div class="form-edit-section-actions">
        <slot name="actions"></slot>
      </div>
    </div>
    <div class="form-edit-section-body"><slot name="body"></slot></div>
  </div>
</template>

<script setup>
defineOptions({
  name: 'FormEditSection'
});
defineProps({
  noBorder: {
    type: Boolean,
    default: false
  }
});
</script>

<style lang="scss">
@import '../../../assets/scss/mixins';
@import '../../../assets/scss/variables';

$heading-margin-bottom: 10px;

.form-edit-section {

  &:not(.no-border) {
    border-radius: 12px;
    border: 1px solid $central-grey-2;
    padding: 20px;
  }

  margin-bottom: 10px;
  display: flex;
  flex-direction: column;
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

  background-color: rgba($color-accent-primary, 0.04);
  border-radius: 6px;
  color: $color-accent-primary;
  padding: 5px 9px;

  // Hide the entire element if no tag slot is provided.
  &:empty { display: none; }
}


.form-edit-section:has(.form-edit-section-subtitle:empty) .form-edit-section-body > p:first-of-type {
  margin-top: -$heading-margin-bottom;
}

.form-edit-section-actions {
  margin-left: auto;
}

</style>
