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
  <span>
    <a :href="href" class="btn btn-primary" target="_blank">
      <span class="icon-arrow-circle-down"></span>View XML
    </a>
  </span>
</template>

<script>
import Form from '../../presenters/form';
import { apiPaths } from '../../util/request';

export default {
  name: 'FormVersionStandardButtons',
  props: {
    version: {
      type: Form,
      required: true
    }
  },
  computed: {
    href() {
      const { projectId, xmlFormId, publishedAt } = this.version;
      return publishedAt != null
        ? apiPaths.formVersionXml(projectId, xmlFormId, this.version.version)
        : apiPaths.formDraftXml(projectId, xmlFormId);
    }
  }
};
</script>
