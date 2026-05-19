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
  <teleport v-if="exists" :to="to">
    <slot></slot>
  </teleport>
  <template v-else>
    <slot></slot>
  </template>
</template>

<script setup>
/*
This component teleports content if the teleport `to` target exists in the DOM.
If the target does not exist, the content is rendered where it is without being
teleported.

This can be useful in testing. Even if the teleport `to` target always exists in
production, a particular test might not render the target if the test doesn't
mount the entire app. In that case, we still want to render the content; we just
won't teleport it. Usually it doesn't matter to tests whether content is
teleported. If it matters, the test should make sure that the teleport `to`
target exists by mounting the whole app and attaching it to the document body.
*/

const props = defineProps({
  to: {
    type: String,
    required: true
  }
});

// This is not reactive. Making it reactive is outside the scope/intention of
// this component.
const exists = document.querySelector(props.to) != null;
</script>
