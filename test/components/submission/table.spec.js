import SubmissionDataRow from '../../../src/components/submission/data-row.vue';
import SubmissionMetadataRow from '../../../src/components/submission/metadata-row.vue';
import SubmissionTable from '../../../src/components/submission/table.vue';

import useFields from '../../../src/request-data/fields';
import useSubmissions from '../../../src/request-data/submissions';

import createTestContainer from '../../util/container';
import testData from '../../data';
import { mergeMountOptions, mount } from '../../util/lifecycle';
import { mockLogin } from '../../util/session';
import { mockRouter } from '../../util/router';
import { testRequestData } from '../../util/request-data';

const mountComponent = (options = undefined) => {
  const merged = mergeMountOptions(options, {
    props: {
      projectId: '1',
      xmlFormId: 'f',
      draft: false
    },
    container: {
      requestData: testRequestData([useFields, useSubmissions], {
        project: testData.extendedProjects.last(),
        fields: testData.extendedForms.last()._fields,
        odata: {
          status: 200,
          data: testData.submissionOData(),
          config: { url: '/' }
        }
      })
    }
  });
  merged.container.router = mockRouter(merged.props.draft
    ? '/projects/1/forms/f/draft/testing'
    : '/projects/1/forms/f/submissions');
  merged.container = createTestContainer(merged.container);
  const { requestData } = merged.container;
  merged.props.fields = requestData.localResources.fields.selectable;
  return mount(SubmissionTable, merged);
};

const headers = (table) => table.findAll('th').map(th => th.text());

describe('SubmissionTable', () => {
  describe('metadata headers', () => {
    it('renders the correct headers for a form', () => {
      testData.extendedSubmissions.createPast(1);
      const component = mountComponent({
        props: { draft: false }
      });
      const table = component.get('.table-freeze-frozen');
      headers(table).should.eql(['', 'Submitted by', 'Submitted at', 'State and actions']);
    });

    it('renders the correct headers for a form draft', () => {
      testData.extendedForms.createPast(1, { draft: true, submissions: 1 });
      testData.extendedSubmissions.createPast(1);
      const component = mountComponent({
        props: { draft: true }
      });
      const table = component.get('.table-freeze-frozen');
      headers(table).should.eql(['', 'Submitted at']);
    });
  });

  describe('field headers', () => {
    it('shows a header for each field', () => {
      testData.extendedForms.createPast(1, {
        fields: [testData.fields.string('/s1'), testData.fields.string('/s2')],
        submissions: 1
      });
      testData.extendedSubmissions.createPast(1);
      const table = mountComponent().get('.table-freeze-scrolling');
      headers(table).should.eql(['s1', 's2', 'Instance ID']);
    });

    it('shows the group name in the header', () => {
      const fields = [
        testData.fields.group('/g'),
        testData.fields.string('/g/s')
      ];
      testData.extendedForms.createPast(1, { fields, submissions: 1 });
      testData.extendedSubmissions.createPast(1);
      const component = mountComponent();
      const table = component.get('.table-freeze-scrolling');
      headers(table).should.eql(['g-s', 'Instance ID']);
    });
  });

  it('renders the correct number of rows', () => {
    testData.extendedForms.createPast(1, { submissions: 2 });
    testData.extendedSubmissions.createPast(2);
    const component = mountComponent();
    component.findAllComponents(SubmissionMetadataRow).length.should.equal(2);
    component.findAllComponents(SubmissionDataRow).length.should.equal(2);
  });

  it('passes the correct rowNumber prop to SubmissionMetadataRow', () => {
    // Create 10 submissions (so that the count is 10), then pass two to the
    // component (as if $top was 2).
    testData.extendedForms.createPast(1, { submissions: 10 });
    testData.extendedSubmissions.createPast(10);
    const component = mountComponent({
      container: {
        requestData: {
          odata: {
            status: 200,
            data: testData.submissionOData(2),
            config: { url: '/' }
          }
        }
      }
    });
    const rows = component.findAllComponents(SubmissionMetadataRow);
    rows.map(row => row.props().rowNumber).should.eql([10, 9]);
  });

  describe('canUpdate prop of SubmissionMetadataRow', () => {
    it('passes true if the user can submission.update', () => {
      mockLogin();
      testData.extendedSubmissions.createPast(1);
      const row = mountComponent().getComponent(SubmissionMetadataRow);
      row.props().canUpdate.should.be.true();
    });

    it('passes false if the user cannot submission.update', () => {
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(1, { role: 'viewer', forms: 1 });
      testData.extendedSubmissions.createPast(1);
      const row = mountComponent().getComponent(SubmissionMetadataRow);
      row.props().canUpdate.should.be.false();
    });
  });
});
