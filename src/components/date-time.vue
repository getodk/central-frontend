<!--
Copyright 2020 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <time v-if="iso != null" :datetime="iso" :title="format(false)">{{ format(true) }}</time>
  <span v-else>{{ blank }}</span>
</template>

<script>
import { DateTime } from 'luxon';

import { formatDateTime } from '../util/date-time';

export default {
  name: 'DateTime',
  props: {
    iso: String,
    relative: {
      type: String,
      default: 'recent'
    },
    blank: {
      type: String,
      default: ''
    }
  },
  computed: {
    dateTime() {
      return DateTime.fromISO(this.iso, { locale: this.$i18n.locale });
    }
  },
  methods: {
    format(useRelative) {
      return formatDateTime(this.dateTime, useRelative ? this.relative : null);
    }
  }
};
</script>
