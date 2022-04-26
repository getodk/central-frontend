import FieldKeyRevoke from '../../../src/components/field-key/revoke.vue';
import FieldKeyRow from '../../../src/components/field-key/row.vue';

import testData from '../../data';
import { load, mockHttp } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('FieldKeyRevoke', () => {
  beforeEach(mockLogin);

  describe('revoke action', () => {
    it('toggles the modal', () => {
      testData.extendedFieldKeys.createPast(1);
      return load('/projects/1/app-users').testModalToggles({
        modal: FieldKeyRevoke,
        show: '.field-key-row .dropdown-menu a',
        hide: '.btn-link'
      });
    });

    it("is disabled if the app user's access has been revoked", async () => {
      testData.extendedFieldKeys.createPast(1, { token: null });
      const app = await load('/projects/1/app-users');
      const li = app.get('.field-key-row .dropdown-menu li');
      li.classes('disabled').should.be.true();
      await li.get('a').trigger('click');
      app.getComponent(FieldKeyRevoke).props().state.should.be.false();
    });
  });

  it('implements some standard button things', () => {
    const fieldKey = testData.extendedFieldKeys.createPast(1).last();
    return mockHttp()
      .mount(FieldKeyRevoke, {
        props: { state: true, fieldKey }
      })
      .testStandardButton({
        button: '.btn-danger',
        disabled: ['.btn-link'],
        modal: true
      });
  });

  describe('after a successful response', () => {
    const revoke = () => {
      testData.extendedProjects.createPast(1, { appUsers: 2 });
      testData.extendedFieldKeys.createPast(2);
      return load('/projects/1/app-users')
        .complete()
        .request(async (app) => {
          await app.get('#field-key-list-table .dropdown-menu a').trigger('click');
          return app.get('#field-key-revoke .btn-danger').trigger('click');
        })
        .respondWithData(() => {
          testData.extendedFieldKeys.update(0, { token: null });
          return { success: true };
        })
        .respondWithData(() => testData.extendedFieldKeys.sorted());
    };

    it('hides the modal', async () => {
      const app = await revoke();
      app.getComponent(FieldKeyRevoke).props().state.should.be.false();
    });

    it('shows a success alert', async () => {
      const app = await revoke();
      app.should.alert('success');
    });

    it('updates the list', async () => {
      const app = await revoke();
      const rows = app.findAllComponents(FieldKeyRow);
      rows.length.should.equal(2);
      rows[0].find('.field-key-row-popover-link').exists().should.be.true();
      rows[1].find('.field-key-row-popover-link').exists().should.be.false();
      rows[1].findAll('td')[3].text().should.equal('Access revoked');
    });
  });
});
