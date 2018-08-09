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
    let counter = 0;
    $(this.$refs.dropZone)
      // When there is a pair of associated dragenter and dragleave events, the
      // dragenter event should be triggered before the dragleave event.
      .on(`dragenter.${eventNamespace}`, (event) => {
        if (noFiles(event)) return;
        // I have encountered conflicting information about whether to prevent
        // the default action of dragenter events. It seems to be needed to
        // support IE 11.
        event.preventDefault();
        this.isOverDropZone = true;
        counter += 1;
      })
      .on(`dragover.${eventNamespace}`, (event) => {
        if (noFiles(event)) return;
        event.preventDefault();
        const { dataTransfer } = event.originalEvent;
        dataTransfer.dropEffect = this.disabled === true ? 'none' : 'copy';
      })
      .on(`dragleave.${eventNamespace}`, (event) => {
        if (noFiles(event)) return;
        counter -= 1;
        if (counter === 0) this.isOverDropZone = false;
      })
      .on(`drop.${eventNamespace}`, (event) => {
        if (noFiles(event)) return;
        event.preventDefault();
        if (this.disabled !== true) this.readFile(event.originalEvent.dataTransfer.files);
        this.isOverDropZone = false;
        counter = 0;
      });
  },
  [keepAlive ? 'deactivated' : 'beforeDestroy']() {
    $(this.$refs.dropZone).off(`.${eventNamespace}`);
  }
});
