import SubmissionList from '../../src/components/submission/list.vue';

import useForm from '../../src/request-data/form';
import useSubmissions from '../../src/request-data/submissions';

import testData from '../data';
import { mergeMountOptions } from './lifecycle';
import { mockHttp } from './http';
import { mockResponse } from './axios';
import { mockRouter } from './router';
import { testRequestData } from './request-data';

// eslint-disable-next-line import/prefer-default-export
export const loadSubmissionList = (mountOptions = {}) => {
  const project = testData.extendedProjects.last();
  const form = testData.extendedForms.last();
  const mergedOptions = mergeMountOptions(mountOptions, {
    props: {
      projectId: project.id.toString(),
      xmlFormId: form.xmlFormId,
      draft: form.publishedAt == null,
      deleted: false
    },
    container: {
      requestData: testRequestData([useForm, 'keys', useSubmissions], {
        project,
        form,
        formDraft: form.publishedAt == null
          ? testData.extendedFormDrafts.last()
          : mockResponse.problem(404.1),
        keys: testData.standardKeys.sorted()
      }),
      router: mockRouter(form.publishedAt != null
        ? `/projects/${project.id}/forms/${encodeURIComponent(form.xmlFormId)}/submissions`
        : `/projects/${project.id}/forms/${encodeURIComponent(form.xmlFormId)}/draft`)
    }
  });
  const { deleted } = mergedOptions.props;
  return mockHttp()
    .mount(SubmissionList, mergedOptions)
    .respondWithData(() => form._fields)
    .modify(series => {
      if (form.publishedAt == null) return series;
      return series.respondWithData(() => testData.extendedFieldKeys
        .sorted()
        .sort((fieldKey1, fieldKey2) =>
          fieldKey1.displayName.localeCompare(fieldKey2.displayName))
        .map(testData.toActor));
    })
    .respondWithData(() => (deleted ? testData.submissionDeletedOData() : testData.submissionOData()));
};
