import FieldKeyRevoke from '../../../src/components/field-key/revoke.vue';
import testData from '../../data';
import { load, mockHttp, mockRoute } from '../../util/http';
import { mockLogin } from '../../util/session';
import { trigger } from '../../util/event';

describe('FieldKeyRevoke', () => {
  beforeEach(mockLogin);

  describe('modal', () => {
    it("is shown after a click if app user's access has not been revoked", () =>
      mockRoute('/projects/1/app-users')
        .respondWithData(() =>
          testData.extendedProjects.createPast(1, { appUsers: 1 }).last())
        .respondWithData(() => testData.extendedFieldKeys
          .createPast(1)
          .sorted())
        .afterResponses(app => {
          app.first(FieldKeyRevoke).getProp('state').should.be.false();
          return app;
        })
        .then(app =>
          trigger.click(app, '#field-key-list-table .dropdown-menu a'))
        .then(app => {
          app.first(FieldKeyRevoke).getProp('state').should.be.true();
        }));

    it("is not shown after a click if app user's access has been revoked", () =>
      mockRoute('/projects/1/app-users')
        .respondWithData(() =>
          testData.extendedProjects.createPast(1, { appUsers: 1 }).last())
        .respondWithData(() =>
          testData.extendedFieldKeys.createPast(1, { token: null }).sorted())
        .afterResponses(app => {
          app.first(FieldKeyRevoke).getProp('state').should.be.false();
          return app;
        })
        .then(app => {
          const li = app.first('#field-key-list-table .dropdown-menu li');
          li.should.be.disabled();
          return trigger.click(app, '#field-key-list-table .dropdown-menu a');
        })
        .then(app => {
          app.first(FieldKeyRevoke).getProp('state').should.be.false();
        }));
  });

  it('implements some standard button things', () => {
    testData.extendedProjects.createPast(1, { appUsers: 1 });
    return mockHttp()
      .mount(FieldKeyRevoke, {
        propsData: {
          fieldKey: testData.extendedFieldKeys.createPast(1).last()
        }
      })
      .request(component =>
        trigger.click(component, '#field-key-revoke .btn-danger'))
      .standardButton('.btn-danger');
  });

  describe('after a successful response', () => {
    const revoke = () => {
      testData.extendedProjects.createPast(1, { appUsers: 2 });
      testData.extendedFieldKeys.createPast(2);
      return load('/projects/1/app-users')
        .complete()
        .request(async (app) => {
          await trigger.click(app, '#field-key-list-table .dropdown-menu a');
          await trigger.click(app, '#field-key-revoke .btn-danger');
          testData.extendedFieldKeys.update(0, { token: null });
        })
        .respondWithSuccess()
        .respondWithData(() => testData.extendedFieldKeys.sorted())
        .toPromise();
    };

    it('hides the modal', async () => {
      const app = await revoke();
      app.first(FieldKeyRevoke).getProp('state').should.be.false();
    });

    it('shows a success alert', async () => {
      const app = await revoke();
      app.should.alert('success');
    });

    it('updates the list', async () => {
      const app = await revoke();
      const tr = app.find('#field-key-list-table tbody tr');
      tr.length.should.equal(2);
      tr[0].find('td')[3].find('a').length.should.equal(1);
      tr[1].find('td')[3].find('a').length.should.equal(0);
      tr[1].find('td')[3].text().trim().should.equal('Access revoked');
    });
  });
});
