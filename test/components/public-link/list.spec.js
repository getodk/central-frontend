import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('PublicLinkList', () => {
  beforeEach(() => {
    mockLogin();
    testData.extendedForms.createPast(1);
  });

  it('shows a message if there are no public links', () =>
    load('/projects/1/forms/f/public-links', { component: true }, {})
      .then(component => {
        component.first('.empty-table-message').should.be.visible();
      }));
});
