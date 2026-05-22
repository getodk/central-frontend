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
    <div class="form-edit-section-heading">
      <div>
        <p class="form-edit-section-title"><slot name="title"></slot></p>
        <p class="form-edit-section-subtitle"><slot name="subtitle"></slot></p>
      </div>
      <div class="form-edit-section-tag">
        <span><slot name="tag"></slot></span>
      </div>
    </div>
    <div class="form-edit-section-body"><slot name="body"></slot></div>
  </div>
</template>

<script setup>
defineOptions({
  name: 'FormEditSection'
});
</script>

<style lang="scss">
@import '../../../assets/scss/mixins';

$heading-margin-bottom: 10px;

.form-edit-section {

  border-radius: 12px;
  border: 1px solid var(--Central-Grey-2, #E3E4E4);
  padding: 20px;
  margin-bottom: 10px;
  column-gap: 15px;
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
  column-gap: $margin-right-icon;

  background-color: rgba($color-accent-primary, 0.04);
  border-radius: 6px;
  color: $color-accent-primary;
  padding: 5px 9px;
}

.form-edit-section:has(.form-edit-section-subtitle:empty) .form-edit-section-body > p:first-of-type {
  margin-top: -$heading-margin-bottom;
}

</style>
