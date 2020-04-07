import SubmissionRow from '../../../src/components/submission/row.vue';
import SubmissionTable from '../../../src/components/submission/table.vue';
import testData from '../../data';
import { mount } from '../../util/lifecycle';

const mountComponent = (propsData = undefined) => mount(SubmissionTable, {
  propsData: {
    baseUrl: '/v1/projects/1/forms/f',
    submissions: testData.submissionOData().value,
    fields: testData.extendedForms.last()._fields,
    originalCount: testData.extendedSubmissions.size,
    ...propsData
  }
});

const field = (type) => (path) => ({ path, type });
const group = field('structure');
const repeat = field('repeat');
const int = field('int');
const string = field('string');

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

  describe('field column headers', () => {
    it('shows the correct header for /some_field', () => {
      const fields = [int('/some_field')];
      testData.extendedForms.createPast(1, { fields, submissions: 1 });
      testData.extendedSubmissions.createPast(1);
      const table = mountComponent().first('#submission-table2');
      headers(table).should.eql(['some_field', 'Instance ID']);
    });

    it('shows the correct header for /some_group/some_field', () => {
      const fields = [group('/some_group'), int('/some_group/some_field')];
      testData.extendedForms.createPast(1, { fields, submissions: 1 });
      testData.extendedSubmissions.createPast(1);
      const table = mountComponent().first('#submission-table2');
      headers(table).should.eql(['some_group-some_field', 'Instance ID']);
    });
  });

  describe('field visibility and field subset indicator', () => {
    it('does not show field subset indicator if there is a single field', () => {
      const fields = [int('/i')];
      testData.extendedForms.createPast(1, { fields, submissions: 1 });
      testData.extendedSubmissions.createPast(1);
      const table = mountComponent().first('#submission-table2');
      table.hasClass('field-subset').should.be.false();
    });

    it('does not show a separate column for a group', () => {
      const fields = [group('/g'), int('/g/i')];
      testData.extendedForms.createPast(1, { fields, submissions: 1 });
      testData.extendedSubmissions.createPast(1);
      const table = mountComponent().first('#submission-table2');
      table.hasClass('field-subset').should.be.false();
      headers(table).should.eql(['g-i', 'Instance ID']);
    });

    describe('instance ID fields', () => {
      it('does not show /meta/instanceID', () => {
        const fields = [group('/meta'), string('/meta/instanceID'), int('/i')];
        testData.extendedForms.createPast(1, { fields, submissions: 1 });
        testData.extendedSubmissions.createPast(1);
        const table = mountComponent().first('#submission-table2');
        table.hasClass('field-subset').should.be.false();
        headers(table).should.eql(['i', 'Instance ID']);
      });

      it('does not show /instanceID', () => {
        const fields = [string('/instanceID'), int('/i')];
        testData.extendedForms.createPast(1, { fields, submissions: 1 });
        testData.extendedSubmissions.createPast(1);
        const table = mountComponent().first('#submission-table2');
        table.hasClass('field-subset').should.be.false();
        headers(table).should.eql(['i', 'Instance ID']);
      });

      it('does not show field subset indicator even if there are 10 other fields', () => {
        const fields = [
          group('/meta'), string('/meta/instanceID'), string('/instanceID'),
          int('/int1'), int('/int2'), int('/int3'), int('/int4'), int('/int5'),
          int('/int6'), int('/int7'), int('/int8'), int('/int9'), int('/int10')
        ];
        testData.extendedForms.createPast(1, { fields, submissions: 1 });
        testData.extendedSubmissions.createPast(1);
        const table = mountComponent().first('#submission-table2');
        table.hasClass('field-subset').should.be.false();
      });
    });

    describe('repeat group', () => {
      it('does not show the fields of a repeat group', () => {
        /* eslint-disable indent */
        const fields = [
          int('/int1'),
          repeat('/repeat1'),
            int('/repeat1/int2'),
            repeat('/repeat1/repeat2'),
              int('/repeat1/repeat2/int3'),
          int('/int4'),
          group('/group1'),
            int('/group1/int5'),
            repeat('/group1/repeat3'),
              int('/group1/repeat3/int6'),
            int('/group1/int7')
        ];
        /* eslint-enable indent */
        testData.extendedForms.createPast(1, { fields, submissions: 1 });
        testData.extendedSubmissions.createPast(1);
        const table = mountComponent().first('#submission-table2');
        table.hasClass('field-subset').should.be.true();
        headers(table).should.eql([
          'int1',
          'int4',
          'group1-int5',
          'group1-int7',
          'Instance ID'
        ]);
      });

      it('does not show a repeat group even if there are no other top-level fields', () => {
        const fields = [repeat('/r'), int('/r/i')];
        testData.extendedForms.createPast(1, { fields, submissions: 1 });
        testData.extendedSubmissions.createPast(1);
        const table = mountComponent().first('#submission-table2');
        table.hasClass('field-subset').should.be.true();
        headers(table).should.eql(['Instance ID']);
      });
    });

    it('does not show more than 10 fields', () => {
      const fields = [
        int('/int1'), int('/int2'), int('/int3'), int('/int4'), int('/int5'),
        int('/int6'), int('/int7'), int('/int8'), int('/int9'), int('/int10'),
        int('/int11')
      ];
      testData.extendedForms.createPast(1, { fields, submissions: 1 });
      testData.extendedSubmissions.createPast(1);
      const table = mountComponent().first('#submission-table2');
      table.hasClass('field-subset').should.be.true();
      headers(table).should.eql([
        'int1', 'int2', 'int3', 'int4', 'int5',
        'int6', 'int7', 'int8', 'int9', 'int10',
        'Instance ID'
      ]);
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

  it('renders data for each field column', () => {
    testData.extendedForms.createPast(1, {
      fields: [
        { path: '/string1', type: 'string' },
        { path: '/string2', type: 'string' }
      ],
      submissions: 1
    });
    testData.extendedSubmissions.createPast(1, {
      instanceId: 'abc',
      string1: 'Some string',
      string2: 'Another string'
    });
    const table = mountComponent().first('#submission-table2');
    headers(table).should.eql(['string1', 'string2', 'Instance ID']);
    const data = table.find('td').map(td => td.text().trim());
    data.should.eql(['Some string', 'Another string', 'abc']);
  });

  it('converts a field to a column object', () => {
    const f = {
      path: '/some_group/some_field',
      type: 'binary',
      binary: true
    };
    SubmissionTable.methods.fieldToColumn(f).should.eql({
      path: '/some_group/some_field',
      type: 'binary',
      binary: true,
      pathComponents: ['some_group', 'some_field'],
      header: 'some_group-some_field'
    });
  });
});
