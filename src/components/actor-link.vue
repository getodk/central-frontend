<!--
Copyright 2021 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <link-if-can v-if="actor.type === 'user' && actor.deletedAt == null" :to="to" class="actor-link" :title="actor.displayName">{{ actor.displayName }}</link-if-can>
  <span v-else class="actor-link" :title="actor.displayName">{{ actor.displayName }}</span>
</template>

<script>
import LinkIfCan from './link-if-can.vue';

import routes from '../mixins/routes';

export default {
  name: 'ActorLink',
  components: { LinkIfCan },
  mixins: [routes()],
  props: {
    actor: {
      type: Object,
      required: true
    }
  },
  computed: {
    to() {
      return this.userPath(this.actor.id);
    }
  }
};
</script>
