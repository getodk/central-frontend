import DateTime from '../../../src/components/date-time.vue';
import SubmissionRow from '../../../src/components/submission/row.vue';
import testData from '../../data';
import { mockLogin } from '../../util/session';
import { mount } from '../../util/lifecycle';

const mountComponent = (propsData = undefined) => mount(SubmissionRow, {
  propsData: {
    submission: testData.extendedSubmissions.last()._oData,
    ...propsData
  }
});

describe('SubmissionRow', () => {
  beforeEach(() => {
    mockLogin({ displayName: 'Alice' });
  });

  describe('frozen columns', () => {
    beforeEach(() => {
      testData.extendedForms.createPast(1, {
        fields: [{ path: '/i', type: 'int' }],
        submissions: 1000
      });
      testData.extendedSubmissions.createPast(1);
    });

    it('shows the row number', () => {
      const td = mountComponent({ rowNumber: 1000 }).first('td');
      td.hasClass('row-number').should.be.true();
      td.text().trim().should.equal('1000');
    });

    describe('submitter name', () => {
      it('shows the submitter name if showsSubmitter is true', () => {
        const component = mountComponent({
          rowNumber: 1,
          showsSubmitter: true
        });
        const td = component.find('td')[1];
        td.hasClass('submitter-name').should.be.true();
        td.text().trim().should.equal('Alice');
        td.getAttribute('title').should.equal('Alice');
      });

      it('does not show the submitter name if showsSubmitter is false', () => {
        const row = mountComponent({ rowNumber: 1, showsSubmitter: false });
        row.find('.submitter-name').length.should.equal(0);
      });
    });

    it('shows the submission date', () => {
      const row = mountComponent({ rowNumber: 1 });
      const { createdAt } = testData.extendedSubmissions.last();
      row.first(DateTime).getProp('iso').should.equal(createdAt);
    });
  });
});
