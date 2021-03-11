import SubmissionDataRow from '../../../src/components/submission/data-row.vue';
import SubmissionMetadataRow from '../../../src/components/submission/metadata-row.vue';
import SubmissionTable from '../../../src/components/submission/table.vue';

import Field from '../../../src/presenters/field';

import testData from '../../data';
import { mockLogin } from '../../util/session';
import { mount } from '../../util/lifecycle';
import { trigger } from '../../util/event';

const mountComponent = (propsData = undefined) => mount(SubmissionTable, {
  propsData: {
    projectId: '1',
    xmlFormId: 'f',
    draft: false,
    submissions: testData.submissionOData().value,
    fields: testData.extendedForms.last()._fields
      .map(field => new Field(field)),
    originalCount: testData.extendedSubmissions.size,
    ...propsData
  },
  requestData: { project: testData.extendedProjects.last() },
  router: true
});

const headers = (table) => table.find('th').map(th => th.text().trim());

describe('SubmissionTable', () => {
  describe('metadata headers', () => {
    it('renders the correct headers for a form', () => {
      testData.extendedSubmissions.createPast(1);
      const component = mountComponent({ draft: false });
      const table = component.first('#submission-table-metadata');
      headers(table).should.eql(['', 'Submitted by', 'Submitted at', 'State and actions']);
    });

    it('renders the correct headers for a form draft', () => {
      testData.extendedForms.createPast(1, { draft: true, submissions: 1 });
      testData.extendedSubmissions.createPast(1);
      const component = mountComponent({ draft: true });
      const table = component.first('#submission-table-metadata');
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
      const table = mountComponent().first('#submission-table-data');
      headers(table).should.eql(['s1', 's2', 'Instance ID']);
    });

    it('shows the group name in the header', () => {
      const fields = [
        testData.fields.group('/g'),
        testData.fields.string('/g/s')
      ];
      testData.extendedForms.createPast(1, { fields, submissions: 1 });
      testData.extendedSubmissions.createPast(1);
      const component = mountComponent({ fields: [new Field(fields[1])] });
      const table = component.first('#submission-table-data');
      headers(table).should.eql(['g-s', 'Instance ID']);
    });
  });

  it('renders the correct number of rows', () => {
    testData.extendedForms.createPast(1, { submissions: 2 });
    testData.extendedSubmissions.createPast(2);
    const component = mountComponent();
    component.find(SubmissionMetadataRow).length.should.equal(2);
    component.find(SubmissionDataRow).length.should.equal(2);
  });

  it('passes the correct rowNumber prop to SubmissionMetadataRow', () => {
    // Create 10 submissions (so that the count is 10), then pass two to the
    // component (as if $top was 2).
    testData.extendedForms.createPast(1, { submissions: 10 });
    testData.extendedSubmissions.createPast(10);
    const component = mountComponent({
      submissions: testData.submissionOData(2).value
    });
    const rows = component.find(SubmissionMetadataRow);
    rows.length.should.equal(2);
    rows[0].getProp('rowNumber').should.equal(10);
    rows[1].getProp('rowNumber').should.equal(9);
  });

  describe('canUpdate prop of SubmissionMetadataRow', () => {
    it('passes true if the user can submission.update', () => {
      mockLogin();
      testData.extendedSubmissions.createPast(1);
      const row = mountComponent().first(SubmissionMetadataRow);
      row.getProp('canUpdate').should.be.true();
    });

    it('passes false if the user cannot submission.update', () => {
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(1, { role: 'viewer', forms: 1 });
      testData.extendedSubmissions.createPast(1);
      const row = mountComponent().first(SubmissionMetadataRow);
      row.getProp('canUpdate').should.be.false();
    });
  });

  describe('visibility of actions', () => {
    it('shows actions if user hovers over a SubmissionDataRow', async () => {
      testData.extendedForms.createPast(1, { submissions: 2 });
      testData.extendedSubmissions.createPast(2);
      const component = mountComponent();
      await trigger.mouseover(component, SubmissionDataRow);
      const metadataRows = component.find(SubmissionMetadataRow);
      metadataRows[0].hasClass('actions-shown').should.be.true();
      metadataRows[1].hasClass('actions-shown').should.be.false();
    });

    it('toggles actions if user hovers over a new SubmissionDataRow', async () => {
      testData.extendedForms.createPast(1, { submissions: 2 });
      testData.extendedSubmissions.createPast(2);
      const component = mountComponent();
      const dataRows = component.find(SubmissionDataRow);
      await trigger.mouseover(dataRows[0]);
      await trigger.mouseover(dataRows[1]);
      const metadataRows = component.find(SubmissionMetadataRow);
      metadataRows[0].hasClass('actions-shown').should.be.false();
      metadataRows[1].hasClass('actions-shown').should.be.true();
    });

    it('hides the actions after the mouse leaves the table', async () => {
      testData.extendedForms.createPast(1, { submissions: 2 });
      testData.extendedSubmissions.createPast(2);
      const component = mountComponent();
      await trigger.mouseover(component, SubmissionDataRow);
      await trigger.mouseleave(component, '#submission-table-data tbody');
      const metadataRow = component.first(SubmissionMetadataRow);
      metadataRow.hasClass('actions-shown').should.be.false();
    });
  });
});
