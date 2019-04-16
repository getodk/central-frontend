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

/*
A component with a single file drop zone may include this mixin. The including
component must:

  - Use the ref attribute to assign a reference ID of 'dropZone' to the drop
    zone element.
  - Define a data property named fileIsOverDropZone that is initialized to
    false. fileIsOverDropZone will be true if a file is over the drop zone and
    false if not. The including component should not mutate this property after
    defining it.

The including component may optionally define the following methods. After a
drag event, the mixin will invoke the associated method, passing it the event as
a jQuery event.

  - ondragenter()
  - ondragover()
  - ondragleave()
  - ondrop()

The including component may also optionally define the following data or
computed property:

  - disabled. true if the drop zone is disabled and false if not. Event handlers
    are not removed when the drop zone is disabled, but events will essentially
    be ignored. The exception is that the mixin will continue to update
    fileIsOverDropZone.

In order to facilitate testing, this mixin uses jQuery event handlers rather
than Vue ones: it is possible to mock a jQuery event but not a Vue event. The
mixin attaches the handlers in the component's mounted hook and removes them in
its beforeDestroy hook. If the component is kept-alive, the mixin uses the
activated and deactivated hooks instead. The including component must indicate
to the mixin whether the component is kept-alive, as well as a unique event
namespace for the event handlers.
*/

const noFiles = (event) =>
  !event.originalEvent.dataTransfer.types.some(type => type === 'Files');

// eslint-disable-next-line arrow-body-style
export default ({ keepAlive, eventNamespace }) => {
  return {
    [keepAlive ? 'activated' : 'mounted']() {
      let enterDepth = 0;
      $(this.$refs.dropZone)
        // When there is a pair of associated dragenter and dragleave events,
        // the dragenter event should be triggered before the dragleave event.
        .on(`dragenter.${eventNamespace}`, (event) => {
          if (noFiles(event)) return;
          // I have encountered conflicting information about whether to prevent
          // the default action of dragenter events. It seems to be needed to
          // support IE 11.
          event.preventDefault();
          this.fileIsOverDropZone = true;
          enterDepth += 1;
          if (this.disabled !== true && this.ondragenter != null)
            this.ondragenter(event);
        })
        .on(`dragover.${eventNamespace}`, (event) => {
          if (noFiles(event)) return;
          event.preventDefault();
          const { dataTransfer } = event.originalEvent;
          dataTransfer.dropEffect = this.disabled === true ? 'none' : 'copy';
          if (this.disabled !== true && this.ondragover != null)
            this.ondragover(event);
        })
        .on(`dragleave.${eventNamespace}`, (event) => {
          if (noFiles(event)) return;
          enterDepth -= 1;
          if (enterDepth === 0) this.fileIsOverDropZone = false;
          if (this.disabled !== true && this.ondragleave != null)
            this.ondragleave(event);
        })
        .on(`drop.${eventNamespace}`, (event) => {
          if (noFiles(event)) return;
          event.preventDefault();
          this.fileIsOverDropZone = false;
          enterDepth = 0;
          if (this.disabled !== true && this.ondrop != null) this.ondrop(event);
        });
    },
    [keepAlive ? 'deactivated' : 'beforeDestroy']() {
      $(this.$refs.dropZone).off(`.${eventNamespace}`);
    }
  };
};
