/*
Copyright 2017 Super Adventure Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/nafundi/super-adventure/blob/master/NOTICE.

This file is part of Super Adventure. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of Super Adventure,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import { mount } from 'avoriaz';

let componentToDestroy = null;

export const markComponentForDestruction = (component) => {
  if (componentToDestroy != null)
    throw new Error('another component has already been marked for destruction and has not been destroyed yet');
  componentToDestroy = component;
};

export const destroyMarkedComponent = () => {
  if (componentToDestroy == null) return;
  componentToDestroy.vm.$destroy();
  if (componentToDestroy.vm.$el.parentNode != null)
    $(componentToDestroy.vm.$el).remove();
  componentToDestroy = null;
};

export const mountAndMark = (component, mountOptions = {}) => {
  const wrapper = mount(component, mountOptions);
  markComponentForDestruction(wrapper);
  return wrapper;
};
