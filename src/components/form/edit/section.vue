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
      </div>
      <div v-if="dotted" class="form-edit-section-dots"></div>
    </div>
    <div>
      <p class="form-edit-section-title"><slot name="title"></slot></p>
      <p class="form-edit-section-subtitle"><slot name="subtitle"></slot></p>
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
  dotted: Boolean
});
</script>

<style lang="scss">
$dots-margin-block: 9px;

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
    padding-top: 16px;
  }
}

.form-edit-section-icon-container {
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
}

.form-edit-section-dots {
  border-left: 2px dotted #999;
  height: 100%;
  margin-top: $dots-margin-block;
}

.form-edit-section-title {
  font-size: 17px;
  font-weight: bold;
  line-height: 1.2;
}

.form-edit-section-subtitle {
  margin-top: -10px;

  &:empty { display: none; }
}
</style>
