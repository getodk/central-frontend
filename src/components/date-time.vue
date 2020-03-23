<!--
Copyright 2020 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/opendatakit/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <span :title="title">{{ text }}</span>
</template>

<script>
import { DateTime } from 'luxon';

import { formatDate } from '../util/date-time';

export default {
  name: 'DateTime',
  props: {
    iso: String // eslint-disable-line vue/require-default-prop
  },
  computed: {
    title() {
      return this.iso != null
        ? DateTime.fromISO(this.iso).toFormat('y/MM/dd HH:mm:ss')
        : null;
    },
    text() {
      return formatDate(this.iso);
    }
  }
};
</script>
