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
  <div v-if="dataExists">
    <checklist-step v-if="form.publishedAt == null" stage="complete">
      <template #title>Upload initial Form definition</template>
      <p>
        <strong>Great work!</strong> Your Form design has been loaded
        successfully.
      </p>
    </checklist-step>
    <checklist-step stage="current">
      <template #title>Upload revised Form definition (optional)</template>
      <p>
        <template v-if="status">
          If you have made changes to the Form itself, including question text
          or logic rules, now is the time to upload the new XML or XLSForm using
          the button to the right.
        </template>
        <template v-else>
          If you have made changes to the Form itself, including question text
          or logic rules, now is the time to
          <router-link :to="formPath('draft')">upload</router-link> the new XML
          or XLSForm.
        </template>
      </p>
    </checklist-step>
    <checklist-step v-if="attachments.length !== 0"
      :stage="missingAttachmentCount === 0 ? 'complete' : 'current'">
      <template #title>Upload Form Media Files</template>
      <p>
        Your Form design references files that we need in order to present your
        Form. You can upload new or updated copies of these for distribution
        under the
        <router-link :to="formPath('draft/attachments')">Media Files</router-link>
        tab.
        <doc-link to="central-forms/#forms-with-attachments">
          Click here to find out more.
        </doc-link>
      </p>
    </checklist-step>
    <checklist-step
      :stage="formDraft.submissions !== 0 ? 'complete' : 'current'">
      <template #title>Test the Form on your mobile device</template>
      <p>
        It&rsquo;s a good idea to test the Form to be sure it (still) works the
        way you expect. Using the
        <router-link :to="formPath('draft/testing')">test QR code</router-link>,
        you can make a test Submission that won&rsquo;t affect your real data.
        <doc-link to="central-forms/#working-with-form-drafts">
          Click here to find out more.
        </doc-link>
      </p>
    </checklist-step>
    <checklist-step stage="current">
      <template #title>Publish the Draft</template>
      <p>
        <template v-if="status">
          When you are sure your Draft is ready and you wish to roll it out to
          your devices in the field, you can publish it using the button to the
          right.
        </template>
        <template v-else>
          When you are sure your Draft is ready and you wish to roll it out to
          your devices in the field, you can
          <router-link :to="formPath('draft')">publish</router-link> it.
        </template>
        <doc-link to="central-forms/#working-with-form-drafts">
          Click here to find out more.
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
