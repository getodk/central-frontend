/*
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/

/*
A component with a single file drop zone may use this mixin.

The mixin factory does not take any options.

The component using the mixin must:

  - Use a `ref` attribute to assign a reference ID of 'dropZone' to the drop
    zone element.
  - Define a data property named dragDepth that is for internal use within the
    mixin. Initialize the property as 0. The component using the mixin should
    not directly mutate this property after defining it.

The component using this mixin may optionally define the following methods.
After a drag event, the mixin will call the associated method, passing it the
event as a jQuery event.

  - ondragenter()
  - ondragover()
  - ondragleave()
  - ondrop()

The component using this mixin may also optionally define the following
property:

  - disabled. `true` if the drop zone is disabled and `false` if not. Event
    handlers are not removed when the drop zone is disabled, but events will
    essentially be ignored. The exception is that the mixin will continue to
    update dragDepth.
*/

const noFiles = (event) =>
  !event.originalEvent.dataTransfer.types.some(type => type === 'Files');

// @vue/component
const mixin = {
  computed: {
    fileIsOverDropZone() {
      return this.dragDepth !== 0;
    }
  },
  mounted() {
    const componentName = this.$options.name;
    $(this.$refs.dropZone)
      // When there is a pair of associated dragenter and dragleave events, the
      // dragenter event should be triggered before the dragleave event.
      .on(`dragenter.${componentName}`, (event) => {
        if (noFiles(event)) return;
        // I have encountered conflicting information about whether to prevent
        // the default action of dragenter events. It seems to be needed to
        // support IE 11.
        event.preventDefault();
        this.dragDepth += 1;
        if (this.disabled !== true && this.ondragenter != null)
          this.ondragenter(event);
      })
      .on(`dragover.${componentName}`, (event) => {
        if (noFiles(event)) return;
        event.preventDefault();
        const { dataTransfer } = event.originalEvent;
        dataTransfer.dropEffect = this.disabled === true ? 'none' : 'copy';
        if (this.disabled !== true && this.ondragover != null)
          this.ondragover(event);
      })
      .on(`dragleave.${componentName}`, (event) => {
        if (noFiles(event)) return;
        this.dragDepth -= 1;
        if (this.disabled !== true && this.ondragleave != null)
          this.ondragleave(event);
      })
      .on(`drop.${componentName}`, (event) => {
        if (noFiles(event)) return;
        event.preventDefault();
        this.dragDepth = 0;
        if (this.disabled !== true && this.ondrop != null) this.ondrop(event);
      });
  },
  beforeUnmount() {
    const componentName = this.$options.name;
    $(this.$refs.dropZone).off(`.${componentName}`);
  }
};

export default () => mixin;
