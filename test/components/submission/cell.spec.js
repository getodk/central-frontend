import SubmissionCell from '../../../src/components/submission/cell.vue';
import SubmissionTable from '../../../src/components/submission/table.vue';
import testData from '../../data';
import { mockLogin } from '../../util/session';
import { mount } from '../../util/lifecycle';

const mountComponent = () => mount(SubmissionCell, {
  propsData: {
    baseUrl: '/base',
    submission: testData.submissionOData().value[0],
    column: SubmissionTable.methods.fieldToColumn(
      testData.extendedForms.last()._fields[0]
    )
  }
});

describe('SubmissionCell', () => {
  beforeEach(mockLogin);

  it('is empty if the value does not exist', () => {
    testData.extendedForms.createPast(1, {
      fields: [{ path: '/s', type: 'string' }],
      submissions: 1
    });
    testData.extendedSubmissions.createPast(1, { s: null });
    const cell = mountComponent();
    cell.text().trim().should.equal('');
    cell.element.hasAttribute('title').should.be.false();
  });

  describe('binary field', () => {
    it("correctly renders a field of type 'binary'", () => {
      testData.extendedForms.createPast(1, {
        fields: [{ path: '/b', type: 'binary', binary: true }],
        submissions: 1
      });
      testData.extendedSubmissions.createPast(1, { instanceId: 'a b', b: 'c d.jpg' });
      const cell = mountComponent();
      cell.hasClass('submission-cell-binary').should.be.true();
      const a = cell.find('a');
      a.length.should.equal(1);
      const href = a[0].getAttribute('href');
      href.should.equal('/base/submissions/a%20b/attachments/c%20d.jpg');
      a[0].find('.icon-check').length.should.equal(1);
      a[0].find('.icon-download').length.should.equal(1);
      cell.element.hasAttribute('title').should.be.false();
    });

    it('correctly renders a binary field of unknown type', () => {
      testData.extendedForms.createPast(1, {
        fields: [{ path: '/b', type: 'something_unknown', binary: true }],
        submissions: 1
      });
      testData.extendedSubmissions.createPast(1, { b: 'x.jpg' });
      const cell = mountComponent();
      cell.hasClass('submission-cell-binary').should.be.true();
      cell.find('a').length.should.equal(1);
    });

    it('is empty if the value does not exist', () => {
      testData.extendedForms.createPast(1, {
        fields: [{ path: '/b', type: 'binary', binary: true }],
        submissions: 1
      });
      testData.extendedSubmissions.createPast(1, { b: null });
      const cell = mountComponent();
      cell.find('a').length.should.equal(0);
      cell.text().trim().should.equal('');
    });
  });
});
