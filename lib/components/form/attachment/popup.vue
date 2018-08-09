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
  <div id="form-attachment-popup">
    <div id="form-attachment-popup-popup">
      <div>
        <template v-if="targetAttachment == null">
          Drag over the file entry you wish to replace with the file and drop
          to upload.
        </template>
        <template v-else>
          Drop now to upload the file as
          <strong>{{ targetAttachment.name }}</strong>.
        </template>
      </div>
    </div>
    <span id="form-attachment-popup-icon" class="icon-cloud-upload"></span>
  </div>
</template>

<script>
export default {
  name: 'FormAttachmentPopup',
  props: {
    targetAttachment: Object // eslint-disable-line vue/require-default-prop
  }
};
</script>

<style lang="sass">
@import '../../../../assets/scss/variables';

#form-attachment-popup {
  // If the popup overlays a row of the table, and a file is dragged over the
  // popup, the row should be targeted. pointer-events is not supported in IE
  // 10.
  pointer-events: none;
}

#form-attachment-popup-popup {
  bottom: 25px;
  position: fixed;
  right: 25px;

  border: 1px solid $color-subpanel-border;
  background-color: $color-subpanel-active;
  height: 100px;
  overflow: hidden;
  padding: 15px 15px 15px 100px;
  width: 400px;

  .icon-arrow-circle-down {
    position: relative;
    right: 10px;
    font-size: 72px;
  }

  // Vertically center the popup content.

  display: table;

  > div {
    display: table-cell;
    vertical-align: middle;
  }
}

#form-attachment-popup-icon {
  bottom: 8px;
  position: fixed;
  right: 345px;

  font-size: 126px;
  color: #5c9cc4;

  &::after {
    left: 33px;
    position: absolute;
    top: 33px;

    background-color: #fff;
    content: '';
    height: 60px;
    width: 60px;
    z-index: -1;
  }
}
</style>
