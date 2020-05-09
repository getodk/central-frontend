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
  <div v-if="dataExists">
    <checklist-step v-if="form.publishedAt == null" stage="complete">
      <template #title>{{ $t('steps[0].title') }}</template>
      <p>
        <strong>{{ $t('steps[0].body[0]') }}</strong>
        {{ $t('steps[0].body[1]') }}
      </p>
    </checklist-step>
    <checklist-step stage="current">
      <template #title>{{ $t('steps[1].title') }}</template>
      <p v-if="status">
        {{ $t('steps[1].body[0].status') }}
      </p>
      <i18n v-else tag="p" :path="$tPath('steps[1].body[0].link.full')">
        <template #upload>
          <router-link :to="formPath('draft')">{{ $t('steps[1].body[0].link.upload') }}</router-link>
        </template>
      </i18n>
    </checklist-step>
    <checklist-step v-if="attachments.length !== 0"
      :stage="missingAttachmentCount === 0 ? 'complete' : 'current'">
      <template #title>{{ $t('steps[2].title') }}</template>
      <p>
        <i18n :path="$tPath('steps[2].body[0].full')">
          <template #mediaFiles>
            <router-link :to="formPath('draft/attachments')">{{ $t('steps[2].body[0].mediaFiles') }}</router-link>
          </template>
        </i18n>
        &nbsp;
        <doc-link to="central-forms/#forms-with-attachments">
          {{ $t('clickForInfo') }}
        </doc-link>
      </p>
    </checklist-step>
    <checklist-step
      :stage="formDraft.submissions !== 0 ? 'complete' : 'current'">
      <template #title>{{ $t('steps[3].title') }}</template>
      <p>
        <i18n :path="$tPath('steps[3].body[0].full')">
          <template #testQrCode>
            <router-link :to="formPath('draft/testing')">{{ $t('steps[3].body[0].testQrCode') }}</router-link>
          </template>
        </i18n>
        &nbsp;
        <doc-link to="central-forms/#working-with-form-drafts">
          {{ $t('clickForInfo') }}
        </doc-link>
      </p>
    </checklist-step>
    <checklist-step stage="current">
      <template #title>{{ $t('steps[4].title') }}</template>
      <p>
        <span v-if="status">{{ $t('steps[4].body[0].status') }}</span>
        <i18n v-else :path="$tPath('steps[4].body[0].link.full')">
          <template #publish>
            <router-link :to="formPath('draft')">{{ $t('steps[4].body[0].link.publish') }}</router-link>
          </template>
        </i18n>
        &nbsp;
        <doc-link to="central-forms/#working-with-form-drafts">
          {{ $t('clickForInfo') }}
        </doc-link>
      </p>
    </checklist-step>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

import ChecklistStep from '../checklist-step.vue';
import DocLink from '../doc-link.vue';
import routes from '../../mixins/routes';
import { requestData } from '../../store/modules/request';

export default {
  name: 'FormDraftChecklist',
  components: { ChecklistStep, DocLink },
  mixins: [routes()],
  props: {
    // Indicates whether the current route path is .../draft.
    status: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    // The component does not assume that this data will exist when the
    // component is created.
    ...requestData([
      'form',
      { key: 'formDraft', getOption: true },
      { key: 'attachments', getOption: true }
    ]),
    ...mapGetters(['missingAttachmentCount']),
    dataExists() {
      return this.$store.getters.dataExists([
        'form',
        'formDraft',
        'attachments'
      ]);
    }
  }
};
</script>
