/*
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/opendatakit/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/

const noFiles = (event) =>
  !event.originalEvent.dataTransfer.types.some(type => type === 'Files');

export default ({ keepAlive, eventNamespace }) => ({
  [keepAlive ? 'activated' : 'mounted']() {
    $(this.$refs.dropZone)
      .on(`dragover.${eventNamespace}`, (event) => {
        if (noFiles(event)) return;
        event.preventDefault();
        // Putting this line in a dragenter listener did not work. Is it
        // possible that a child element of the drop zone element could trigger
        // a dragleave event before the dragenter listener is called?
        this.isOverDropZone = true;
        // eslint-disable-next-line no-param-reassign
        if (!this.disabled) event.originalEvent.dataTransfer.dropEffect = 'copy';
      })
      .on(`dragleave.${eventNamespace}`, (event) => {
        if (noFiles(event)) return;
        this.isOverDropZone = false;
      })
      .on(`drop.${eventNamespace}`, (event) => {
        if (noFiles(event)) return;
        event.preventDefault();
        if (!this.disabled) this.readFile(event.originalEvent.dataTransfer.files);
        this.isOverDropZone = false;
      });
  },
  [keepAlive ? 'deactivated' : 'beforeDestroy']() {
    $(this.$refs.dropZone).off(`.${eventNamespace}`);
  },
  methods: {
    // Used to prevent descendant elements of the drop zone element from
    // triggering dragleave events upon hover. Does not work in IE 10.
    pointerEvents() {
      return this.isOverDropZone ? { 'pointer-events': 'none' } : {};
    }
  }
});
