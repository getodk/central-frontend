<!--
Copyright 2019 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div v-if="dataExists" id="form-checklist">
    <checklist-step :stage="stepStage(0)">
      <template #title>{{ $t('steps[0].title') }}</template>
      <p>
        <strong>{{ $t('steps[0].body[0]') }}</strong>
        {{ $t('steps[0].body[1]') }}
        <doc-link to="central-forms/#updating-forms-to-a-new-version">
          {{ $t('clickForInfo') }}
        </doc-link>
      </p>
    </checklist-step>
    <checklist-step :stage="stepStage(1)">
      <template #title>{{ $t('steps[1].title') }}</template>
      <p>
        <template v-if="form.submissions === 0">
          {{ $t('steps[1].body[0].none') }}
        </template>
        <template v-else>
          {{ $tcn('steps[1].body[0].any', form.submissions) }}
        </template>
        {{ $t('steps[1].body[1]') }}
        <template v-if="project.appUsers === 0">
          <strong>{{ $t('steps[1].body[2].none[0]') }}</strong>
          <i18n :tag="false" path="steps[1].body[2].none[1].full">
            <template #appUsersTab>
              <router-link :to="projectPath('app-users')">{{ $t('steps[1].body[2].none[1].appUsersTab') }}</router-link>
            </template>
          </i18n>
        </template>
        <template v-else>
          <i18n
            :path="$tcPath('steps[1].body[2].any[0].full', formActors.length)">
            <template #countOfAppUsers>
              <router-link :to="projectPath('form-access')">
                <strong>{{ $tcn('steps[1].body[2].any[0].countOfAppUsers', formActors.length) }}</strong>
              </router-link>
            </template>
            <template #addMore>
              <router-link :to="projectPath('app-users')">{{ $t('steps[1].body[2].any[0].addMore') }}</router-link>
            </template>
          </i18n>
        </template>
        <i18n :tag="false" path="steps[1].body[3].full">
          <template #clickHere>
            <doc-link to="central-submissions/">{{ $t('steps[1].body[3].clickHere') }}</doc-link>
          </template>
        </i18n>
      </p>
    </checklist-step>
    <checklist-step :stage="stepStage(2)">
      <template #title>{{ $t('steps[2].title') }}</template>
      <p>
        <template v-if="form.submissions === 0">
          {{ $t('steps[2].body[0].none') }}
        </template>
        <template v-else>
          {{ $tcn('steps[2].body[0].any', form.submissions) }}
        </template>
        <i18n :tag="false" path="steps[2].body[1].full">
          <template #submissionsTab>
            <router-link :to="formPath('submissions')">{{ $t('steps[2].body[1].submissionsTab') }}</router-link>
          </template>
        </i18n>
        <doc-link to="central-submissions/">{{ $t('clickForInfo') }}</doc-link>
      </p>
    </checklist-step>
    <checklist-step :stage="stepStage(3)">
      <template #title>{{ $t('steps[3].title') }}</template>
      <p>
        <i18n :tag="false" path="steps[3].body[0].full">
          <template #formAccessTab>
            <router-link :to="projectPath('form-access')">{{ $t('steps[3].body[0].formAccessTab') }}</router-link>
          </template>
        </i18n>
        <doc-link to="central-forms/#managing-form-lifecycle">
          {{ $t('clickForInfo') }}
        </doc-link>
      </p>
    </checklist-step>
  </div>
</template>

<script>
import ChecklistStep from '../checklist-step.vue';
import DocLink from '../doc-link.vue';
import routes from '../../mixins/routes';
import { requestData } from '../../store/modules/request';

// The component does not assume that this data will exist when the component is
// created.
const requestKeys = ['project', 'form', 'formActors'];

export default {
  name: 'FormChecklist',
  components: { ChecklistStep, DocLink },
  mixins: [routes()],
  computed: {
    ...requestData(requestKeys),
    dataExists() {
      return this.$store.getters.dataExists(requestKeys);
    },
    // Indicates whether each step is complete.
    stepCompletion() {
      return [
        true,
        this.form.submissions !== 0,
        false,
        this.form.state !== 'open'
      ];
    }
  },
  methods: {
    stepStage(step) {
      if (this.stepCompletion[step]) return 'complete';
      const current = this.stepCompletion.findIndex(isComplete => !isComplete);
      return step === current ? 'current' : 'later';
    }
  }
};
</script>

<i18n lang="json5">
{
  "en": {
    "clickForInfo": "Click here to find out more.",
    "steps": [
      {
        // This is the title of a checklist item.
        "title": "Publish your first Draft version",
        "body": [
          "Great work!",
          "You have published your Form. It is ready to accept Submissions. If you want to make changes to the Form or its Media Files, you can make a new Draft."
        ]
      },
      {
        // This is the title of a checklist item.
        "title": "Download Form on survey clients and submit data",
        "body": [
          {
            "none": "Nobody has submitted any data to this Form yet.",
            "any": "A total of {count} Submission has been sent to this server. | A total of {count} Submissions have been sent to this server."
          },
          "App Users will be able to see this Form on their mobile device to download and fill out.",
          {
            "none": [
              "You have not created any App Users for this Project yet, so nobody will be able to use this Form.",
              {
                "full": "You can create them on the {appUsersTab}.",
                "appUsersTab": "App Users tab of the Project page"
              }
            ],
            "any": [
              {
                "full": [
                  "Right now, {countOfAppUsers} in this Project has access to this Form, but you can always {addMore}.",
                  "Right now, {countOfAppUsers} in this Project have access to this Form, but you can always {addMore}."
                ],
                "countOfAppUsers": "{count} App User | {count} App Users",
                "addMore": "add more"
              }
            ]
          },
          {
            "full": "For more information about this, {clickHere}.",
            "clickHere": "click here"
          }
        ]
      },
      {
        // This is the title of a checklist item.
        "title": "Evaluate and analyze submitted data",
        "body": [
          {
            "none": "Once there is data for this Form, you can export or synchronize it to monitor and analyze the data for quality and results.",
            "any": "You can export or synchronize the {count} Submission on this Form to monitor and analyze the Submission for quality and results. | You can export or synchronize the {count} Submissions on this Form to monitor and analyze them for quality and results."
          },
          {
            "full": "You can do this with the Download and Analyze buttons on the {submissionsTab}.",
            "submissionsTab": "Submissions tab"
          }
        ]
      },
      {
        // This is the title of a checklist item.
        "title": "Manage Form retirement",
        "body": [
          {
            "full": "As you come to the end of your data collection, you can use the Form State controls on the {formAccessTab} to control whether, for example, App Users will be able to see or create new Submissions to this Form.",
            "formAccessTab": "Form Access tab of the Project page"
          }
        ]
      }
    ]
  }
}
</i18n>
