/*
Copyright 2023 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import { onMounted, onUnmounted } from 'vue';

const preventAndStop = (event) => {
  event.preventDefault();
  event.stopPropagation();
};

const preventDisabledClick = (event) => {
  const { target } = event;
  const disabled = target.closest('a.disabled, .disabled > a');
  if (disabled != null) preventAndStop(event);
};

export default () => {
  onMounted(() => {
    document.body.addEventListener('click', preventDisabledClick, true);
  });
  onUnmounted(() => {
    document.body.removeEventListener('click', preventDisabledClick, true);
  });
};
