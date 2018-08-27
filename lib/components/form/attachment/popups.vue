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
  <div v-show="state" id="form-attachment-popups">
    <div v-show="plannedUploads.length !== 0 && unmatchedFiles.length !== 0"
      id="form-attachment-popups-unmatched">
      <template v-if="unmatchedFiles.length === 1">
        <strong>1 file</strong> has a name we don’t recognize and will be
        ignored. To upload it, rename it or drag it onto its target.
      </template>
      <template v-else>
        <strong>{{ unmatchedFiles.length.toLocaleString() }} files</strong> have
        a name we don’t recognize and will be ignored. To upload them, rename
        them or drag them individually onto their targets.
      </template>
    </div>
    <div id="form-attachment-popups-main">
      <div>
        <template v-if="uploadStatus.current != null">
          <div>
            Please wait, uploading your
            {{ $pluralize('file', uploadStatus.total) }}:
          </div>
          <div id="form-attachment-popups-current">
            <strong>Sending {{ uploadStatus.current }}</strong>
            <span v-show="uploadStatus.total !== 1">
              ({{ percentComplete }})
            </span>
          </div>
          <div v-if="uploadStatus.total !== 1">
            {{ uploadStatus.total.toLocaleString() }}
            {{ $pluralize('file', uploadStatus.total - uploadStatus.complete) }}
            remain.
          </div>
        </template>
        <template v-else-if="plannedUploads.length !== 0">
          <p id="form-attachment-popups-action-text">
            <strong>{{ plannedUploads.length.toLocaleString() }}
            {{ $pluralize('file', plannedUploads.length) }}</strong> ready for
            upload.
          </p>
          <div>
            <button type="button" class="btn btn-primary"
              @click="$emit('confirm')">
              Looks good, proceed
            </button>
            <button type="button" class="btn btn-link" @click="$emit('cancel')">
              Cancel
            </button>
          </div>
        </template>
        <template v-else-if="unmatchedFiles.length !== 0">
          <!-- TODO: Add exclamation triangle. -->
          We don’t recognize any of the files you are trying to upload. Please
          rename them to match the names listed above, or drag them individually
          onto their targets.
        </template>
        <template v-else-if="dragoverAttachment != null">
          <div id="form-attachment-popups-action-text">
            Drop now to upload this file as
            <strong>{{ dragoverAttachment.name }}</strong>.
          </div>
        </template>
        <template v-else-if="countOfFilesOverDropZone === 1">
          <div id="form-attachment-popups-action-text">
            Drag over the file entry you wish to replace with the file and drop
            to upload.
          </div>
        </template>
        <template v-else-if="countOfFilesOverDropZone > 1">
          <div id="form-attachment-popups-action-text">
            Drop now to prepare
            <strong>{{ countOfFilesOverDropZone.toLocaleString() }}</strong>
            files for upload to this form.
          </div>
        </template>
        <template v-else-if="countOfFilesOverDropZone === -1">
          <div id="form-attachment-popups-action-text">
            Drop now to upload to this form.
          </div>
        </template>
      </div>
    </div>
    <span id="form-attachment-popups-cloud" class="icon-cloud-upload"></span>
    <div v-show="uploadStatus.current != null" id="form-attachment-popups-backdrop">
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
    uploadStatus: {
      type: Object,
      required: true
    }
  },
  computed: {
    state() {
      return this.countOfFilesOverDropZone !== 0 ||
        this.plannedUploads.length !== 0 || this.unmatchedFiles.length !== 0 ||
        this.uploadStatus.current != null;
    },
    // TODO. Use ProgressEvent.
    percentComplete() {
      const fraction = this.uploadStatus.complete / this.uploadStatus.total;
      // Not using the option { style: 'percent' }, because it is not supported
      // in IE 10.
      return `${Math.round(100 * fraction).toLocaleString()}%`;
    }
  }
};
</script>

<style lang="sass">
@import '../../../../assets/scss/variables';

$z-index-backdrop: 1;

$bottom-main: 25px;
$height-main: 120px;
$padding-left-main: 145px;
$padding-right-main: 15px;
$right-main: 25px;
$width-main: 450px;
$z-index-main: $z-index-backdrop + 1;

$bottom-unmatched: $bottom-main + $height-main + 10px;
$height-unmatched: 100px;
$width-unmatched: 375px;

$bottom-cloud: 3px;
$stretch-cloud: 11;
$font-size-cloud: 14px * $stretch-cloud;
$right-cloud: $width-main - 75px;

$width-current: $width-main - $padding-left-main - $padding-right-main;

#form-attachment-popups {
  // If a popup overlays a row of the table, and a file is dragged over the
  // popup, the row should be targeted. pointer-events is not supported in IE
  // 10.
  pointer-events: none;

  button {
    pointer-events: auto;
  }
}

#form-attachment-popups-unmatched, #form-attachment-popups-main {
  position: fixed;
  right: $right-main;
  overflow: hidden;
  z-index: $z-index-main;
}

#form-attachment-popups-unmatched {
  background-color: #e1bf50;
  bottom: $bottom-unmatched;
  height: $height-unmatched;
  padding: 15px;
  width: $width-unmatched;
}

#form-attachment-popups-main {
  background-color: $color-subpanel-active;
  bottom: $bottom-main;
  border: 1px solid $color-subpanel-border;
  height: $height-main;
  padding: 15px $padding-right-main 15px $padding-left-main;
  width: $width-main;

  // Vertically center the popup content.

  display: table;

  > div {
    display: table-cell;
    vertical-align: middle;
  }
}

#form-attachment-popups-action-text {
  font-size: 18px;
}

#form-attachment-popups-current {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  // We seem to need to set the width for text-overflow to work.
  width: $width-current;
}

#form-attachment-popups-cloud {
  bottom: $bottom-cloud;
  position: fixed;
  right: $right-cloud;

  font-size: $font-size-cloud;
  color: $color-action-background;
  z-index: $z-index-main;

  &::after {
    left: 42px;
    position: absolute;
    top: 42px;

    background-color: #fff;
    content: '';
    height: 70px;
    width: 70px;
    z-index: -1;
  }
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
