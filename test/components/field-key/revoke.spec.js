import FieldKeyRevoke from '../../../src/components/field-key/revoke.vue';
import testData from '../../data';
import { mockHttp, mockRoute } from '../../util/http';
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
    let app;
    beforeEach(() => mockRoute('/projects/1/app-users')
      .respondWithData(() =>
        testData.extendedProjects.createPast(1, { appUsers: 2 }).last())
      .respondWithData(() => testData.extendedFieldKeys
        .createPast(2)
        .sorted())
      .afterResponses(component => {
        app = component;
      })
      .request(() =>
        trigger.click(app, '#field-key-list-table .dropdown-menu a')
          .then(() => trigger.click(app, '#field-key-revoke .btn-danger'))
          .then(() => {
            testData.extendedFieldKeys.update(
              testData.extendedFieldKeys.sorted()[0],
              { token: null }
            );
          }))
      .respondWithSuccess()
      .respondWithData(() => testData.extendedFieldKeys.sorted()));

    it('modal hides', () => {
      app.first(FieldKeyRevoke).getProp('state').should.be.false();
    });

    it('success message is shown', () => {
      app.should.alert('success');
    });

    it('list is updated', () => {
      const tr = app.find('#field-key-list-table tbody tr');
      tr.length.should.equal(2);
      tr[0].find('td')[3].find('a').length.should.equal(1);
      tr[1].find('td')[3].find('a').length.should.equal(0);
      tr[1].find('td')[3].text().trim().should.equal('Access revoked');
    });
  });
});
