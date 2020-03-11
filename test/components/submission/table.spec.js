import SubmissionTable from '../../../src/components/submission/table.vue';
import { mount } from '../../util/lifecycle';

const mountComponent = (fields) => mount(SubmissionTable, {
  propsData: {
    baseUrl: '/v1/projects/1/forms/f',
    submissions: [],
    fields,
    originalCount: 0
  }
});

const field = (type) => (path) => ({ path, type });
const group = field('structure');
const repeat = field('repeat');
const int = field('int');
const string = field('string');

const headers = (table) => table.find('th').map(th => th.text().trim());

describe('SubmissionTable', () => {
  describe('column headers', () => {
    it('shows the correct header for /some_field', () => {
      const component = mountComponent([int('/some_field')]);
      const table = component.first('#submission-table2');
      headers(table).should.eql(['some_field', 'Instance ID']);
    });

    it('shows the correct header for /some_group/some_field', () => {
      const component = mountComponent([
        group('/some_group'),
        int('/some_group/some_field')
      ]);
      const table = component.first('#submission-table2');
      headers(table).should.eql(['some_group-some_field', 'Instance ID']);
    });
  });

  describe('field visibility and field subset indicator', () => {
    it('does not show field subset indicator if there is a single field', () => {
      const component = mountComponent([int('/i')]);
      const table = component.first('#submission-table2');
      table.hasClass('field-subset').should.be.false();
    });

    it('does not show a separate column for a group', () => {
      const component = mountComponent([group('/g'), int('/g/i')]);
      const table = component.first('#submission-table2');
      table.hasClass('field-subset').should.be.false();
      headers(table).should.eql(['g-i', 'Instance ID']);
    });

    describe('instance ID fields', () => {
      it('does not show /meta/instanceID', () => {
        const component = mountComponent([
          group('/meta'),
          string('/meta/instanceID'),
          int('/i')
        ]);
        const table = component.first('#submission-table2');
        table.hasClass('field-subset').should.be.false();
        headers(table).should.eql(['i', 'Instance ID']);
      });

      it('does not show /instanceID', () => {
        const component = mountComponent([string('/instanceID'), int('/i')]);
        const table = component.first('#submission-table2');
        table.hasClass('field-subset').should.be.false();
        headers(table).should.eql(['i', 'Instance ID']);
      });

      it('does not show field subset indicator even if there are 10 other fields', () => {
        const component = mountComponent([
          group('/meta'), string('/meta/instanceID'), string('/instanceID'),
          int('/int1'), int('/int2'), int('/int3'), int('/int4'), int('/int5'),
          int('/int6'), int('/int7'), int('/int8'), int('/int9'), int('/int10')
        ]);
        const table = component.first('#submission-table2');
        table.hasClass('field-subset').should.be.false();
      });
    });

    describe('repeat group', () => {
      it('does not show the fields of a repeat group', () => {
        /* eslint-disable indent */
        const component = mountComponent([
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
        ]);
        /* eslint-enable indent */
        const table = component.first('#submission-table2');
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
        const component = mountComponent([repeat('/r'), int('/r/i')]);
        const table = component.first('#submission-table2');
        table.hasClass('field-subset').should.be.true();
        headers(table).should.eql(['Instance ID']);
      });
    });

    it('does not show more than 10 fields', () => {
      const component = mountComponent([
        int('/int1'), int('/int2'), int('/int3'), int('/int4'), int('/int5'),
        int('/int6'), int('/int7'), int('/int8'), int('/int9'), int('/int10'),
        int('/int11')
      ]);
      const table = component.first('#submission-table2');
      table.hasClass('field-subset').should.be.true();
      headers(table).should.eql([
        'int1', 'int2', 'int3', 'int4', 'int5',
        'int6', 'int7', 'int8', 'int9', 'int10',
        'Instance ID'
      ]);
    });
  });
});
