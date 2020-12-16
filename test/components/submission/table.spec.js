import SubmissionRow from '../../../src/components/submission/row.vue';
import SubmissionTable from '../../../src/components/submission/table.vue';

import Field from '../../../src/presenters/field';

import testData from '../../data';
import { mount } from '../../util/lifecycle';

const mountComponent = (propsData = undefined) => mount(SubmissionTable, {
  propsData: {
    baseUrl: '/v1/projects/1/forms/f',
    submissions: testData.submissionOData().value,
    fields: testData.extendedForms.last()._fields
      .map(field => new Field(field)),
    originalCount: testData.extendedSubmissions.size,
    ...propsData
  }
});

const headers = (table) => table.find('th').map(th => th.text().trim());

describe('SubmissionTable', () => {
  describe('"Submitted by" header', () => {
    beforeEach(() => {
      testData.extendedForms.createPast(1, { submissions: 1 });
      testData.extendedSubmissions.createPast(1);
    });

    it('renders the header if showsSubmitter is true', () => {
      const component = mountComponent({ showsSubmitter: true });
      const table = component.first('#submission-table1');
      headers(table).should.eql(['', 'Submitted by', 'Submitted at']);
    });

    it('does not render the header if showsSubmitter is false', () => {
      const component = mountComponent({ showsSubmitter: false });
      const table = component.first('#submission-table1');
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
      const table = mountComponent().first('#submission-table2');
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
      const table = component.first('#submission-table2');
      headers(table).should.eql(['g-s', 'Instance ID']);
    });
  });

  it('renders the correct number of rows', () => {
    testData.extendedForms.createPast(1, { submissions: 2 });
    testData.extendedSubmissions.createPast(2);
    const component = mountComponent();
    component.find('#submission-table1 tbody tr').length.should.equal(2);
    component.find('#submission-table2 tbody tr').length.should.equal(2);
  });

  it('passes the correct rowNumber prop to SubmissionRow', () => {
    // Create 10 submissions (so that the count is 10), then pass two to the
    // component (as if $top was 2).
    testData.extendedForms.createPast(1, { submissions: 10 });
    testData.extendedSubmissions.createPast(10);
    const component = mountComponent({
      submissions: testData.submissionOData(2).value
    });
    const rows = component.find(SubmissionRow);
    rows.length.should.equal(4);
    rows[0].getProp('rowNumber').should.equal(10);
    rows[1].getProp('rowNumber').should.equal(9);
  });
});
