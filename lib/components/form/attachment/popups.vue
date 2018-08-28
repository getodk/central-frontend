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
  <div id="form-attachment-popups">
    <div v-show="plannedUploads.length !== 0 && unmatchedFiles.length !== 0"
      id="form-attachment-popups-unmatched">
      <template v-if="unmatchedFiles.length === 1">
        <span class="icon-exclamation-triangle">
        </span><strong>1 file</strong> has a name we don’t recognize and will be
        ignored. To upload it, rename it or drag it onto its target.
      </template>
      <template v-else>
        <span class="icon-exclamation-triangle">
        </span><strong>{{ unmatchedFiles.length.toLocaleString() }}
        files</strong> have a name we don’t recognize and will be ignored. To
        upload them, rename them or drag them individually onto their targets.
      </template>
    </div>
    <div v-show="state" id="form-attachment-popups-main">
      <span class="icon-cloud-upload"></span>
      <div>
        <template v-if="uploadStatus.current != null">
          <p>
            Please wait, uploading your
            {{ $pluralize('file', uploadStatus.total) }}:
          </p>
          <p id="form-attachment-popups-current">
            <strong>Sending {{ uploadStatus.current }}</strong>
            <span v-if="hasProgress">({{ percentLoaded }})</span>
          </p>
          <p v-if="uploadStatus.total !== 1">
            <template v-if="uploadStatus.remaining > 1">
              {{ uploadStatus.remaining.toLocaleString() }} files remain.
            </template>
            <template v-else>
              This is the last file.
            </template>
          </p>
        </template>
        <template v-else-if="plannedUploads.length !== 0 && !nameMismatch.state">
          <p id="form-attachment-popups-action-text">
            <strong>{{ plannedUploads.length.toLocaleString() }}
            {{ $pluralize('file', plannedUploads.length) }}</strong> ready for
            upload.
          </p>
          <p>
            <button type="button" class="btn btn-primary"
              @click="$emit('confirm')">
              Looks good, proceed
            </button>
            <button type="button" class="btn btn-link" @click="$emit('cancel')">
              Cancel
            </button>
          </p>
        </template>
        <template v-else-if="unmatchedFiles.length !== 0 && !nameMismatch.state">
          We don’t recognize any of the files you are trying to upload. Please
          rename them to match the names listed above, or drag them individually
          onto their targets.
        </template>
        <template v-else-if="dragoverAttachment != null">
          <p id="form-attachment-popups-action-text">
            Drop now to upload this file as
            <strong>{{ dragoverAttachment.name }}</strong>.
          </p>
        </template>
        <template v-else-if="countOfFilesOverDropZone === 1">
          <p id="form-attachment-popups-action-text">
            Drag over the file entry you wish to replace with the file and drop
            to upload.
          </p>
        </template>
        <template v-else-if="countOfFilesOverDropZone > 1">
          <p id="form-attachment-popups-action-text">
            Drop now to prepare
            <strong>{{ countOfFilesOverDropZone.toLocaleString() }}</strong>
            files for upload to this form.
          </p>
        </template>
        <template v-else-if="countOfFilesOverDropZone === -1">
          <p id="form-attachment-popups-action-text">
            Drop now to upload to this form.
          </p>
        </template>
      </div>
    </div>
    <div v-show="uploadStatus.total !== 0" id="form-attachment-popups-backdrop">
    </div>
  </div>
</template>

<script>
export default {
  name: 'FormAttachmentPopups',
  props: {
    countOfFilesOverDropZone: {
      type: Number,
      required: true
    },
    dragoverAttachment: Object, // eslint-disable-line vue/require-default-prop
    plannedUploads: {
      type: Array,
      required: true
    },
    unmatchedFiles: {
      type: Array,
      required: true
    },
    nameMismatch: {
      type: Object,
      required: true
    },
    uploadStatus: {
      type: Object,
      required: true
    }
  },
  computed: {
    state() {
      const showDuringDragover = this.countOfFilesOverDropZone !== 0;
      const showAfterDrop = !this.nameMismatch.state &&
        (this.plannedUploads.length !== 0 || this.unmatchedFiles.length !== 0);
      const showDuringUpload = this.uploadStatus.current != null;
      return showDuringDragover || showAfterDrop || showDuringUpload;
    },
    hasProgress() {
      const { progress } = this.uploadStatus;
      return progress != null && progress.lengthComputable;
    },
    percentLoaded() {
      const { loaded, total } = this.uploadStatus.progress;
      // Not using the option { style: 'percent' }, because it is not supported
      // in IE 10.
      return `${Math.floor(100 * (loaded / total)).toLocaleString()}%`;
    }
  }
};
</script>

<style lang="sass">
@import '../../../../assets/scss/variables';

$z-index-backdrop: 1;

$border-width-main: 1px;
$bottom-main: 25px;
// Based on the height of the icon
$height-main: 98px;
$padding-main: 15px;
// Add space between the icon and the rest of the popup's content.
$padding-left-main: $padding-main + 75px;
$right-main: 25px;
$z-index-main: $z-index-backdrop + 1;

$font-size-cloud: 14px * 9;
// Roughly half the width of the icon
$left-cloud: -62px;
$top-cloud: -11px;

$height-main-content: $height-main - 2 * $padding-main - 2 * $border-width-main;
$width-main-content: 275px;

$bottom-unmatched: $bottom-main + $height-main + 10px;
$margin-right-unmatched-icon: 6px;
$width-unmatched: 350px;
$width-unmatched-icon: 17px;
$margin-left-unmatched-icon: -$width-unmatched-icon -
  $margin-right-unmatched-icon;
$padding-left-unmatched: $padding-main + $width-unmatched-icon +
  $margin-right-unmatched-icon;

#form-attachment-popups-unmatched, #form-attachment-popups-main {
  line-height: 1.2em;
  padding: $padding-main;
  position: fixed;
  right: $right-main;
  z-index: $z-index-main;

  // If a popup overlays a row of the table, and a file is dragged over the
  // popup, the row should be targeted. pointer-events is not supported in IE
  // 10.
  pointer-events: none;

  button {
    pointer-events: auto;
  }
}

#form-attachment-popups-unmatched {
  background-color: #e1bf50;
  bottom: $bottom-unmatched;
  padding-left: $padding-left-unmatched;
  width: $width-unmatched;

  .icon-exclamation-triangle {
    font-size: 17px;
    margin-left: $margin-left-unmatched-icon;
    margin-right: $margin-right-unmatched-icon;
    vertical-align: -2px;
  }
}

#form-attachment-popups-main {
  background-color: $color-subpanel-active;
  bottom: $bottom-main;
  border: $border-width-main solid $color-subpanel-border;
  padding-left: $padding-left-main;

  .icon-cloud-upload {
    color: $color-action-background;
    font-size: $font-size-cloud;
    left: $left-cloud;
    position: absolute;
    top: $top-cloud;

    &::after {
      left: 34px;
      position: absolute;
      top: 34px;

      background-color: #fff;
      content: '';
      height: 60px;
      width: 60px;
      z-index: -1;
    }
  }

  > div {
    height: $height-main-content;
    overflow: hidden;
    width: $width-main-content;
  }
}

#form-attachment-popups-action-text {
  font-size: 18px;
}

#form-attachment-popups-current {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  // We need to set the width for text-overflow to work.
  width: $width-main-content;
}

#form-attachment-popups-backdrop {
  background-color: #000;
  bottom: 0;
  left: 0;
  opacity: .8;
  position: fixed;
  right: 0;
  top: 0;
  z-index: $z-index-backdrop;
}
</style>
