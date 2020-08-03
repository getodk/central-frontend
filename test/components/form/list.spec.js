import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('FormList', () => {
  describe('create button', () => {
    it('shows the button to an administrator', async () => {
      mockLogin({ role: 'admin' });
      testData.extendedProjects.createPast(1);
      const app = await load('/projects/1');
      app.first('#form-list-create-button').should.be.visible();
    });

    it('does not render the button for a project viewer', async () => {
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(1, { role: 'viewer' });
      const app = await load('/projects/1');
      app.find('#form-list-create-button').length.should.equal(0);
    });
  });

  it('shows a message if there are no forms', async () => {
    mockLogin();
    testData.extendedProjects.createPast(1);
    const app = await load('/projects/1');
    app.first('#form-list .empty-table-message').should.be.visible();
  });
});
