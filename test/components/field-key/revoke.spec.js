import FieldKeyList from '../../../lib/components/field-key/list.vue';
import FieldKeyRevoke from '../../../lib/components/field-key/revoke.vue';
import testData from '../../data';
import { mockHttp, mockRoute } from '../../http';
import { mockLogin } from '../../session';
import { trigger } from '../../util';

const clickRevokeInMenu = (wrapper) =>
  trigger.click(wrapper.first('#field-key-list-table .dropdown-menu a'))
    .then(() => wrapper);
const confirmRevoke = (wrapper) =>
  trigger.click(wrapper.first('#field-key-revoke .btn-danger'))
    .then(() => wrapper);

describe('FieldKeyRevoke', () => {
  beforeEach(mockLogin);

  describe('modal', () => {
    it('opens upon click for an app user whose access is not revoked', () =>
      mockHttp()
        .mount(FieldKeyList)
        .respondWithData(() =>
          testData.extendedFieldKeys.createPast(1, 'withAccess').sorted())
        .afterResponse(page => {
          page.first(FieldKeyRevoke).getProp('state').should.be.false();
          return page;
        })
        .then(clickRevokeInMenu)
        .then(page => {
          page.first(FieldKeyRevoke).getProp('state').should.be.true();
        }));

    it('does not open upon click for an app user whose access is revoked', () =>
      mockHttp()
        .mount(FieldKeyList)
        .respondWithData(() =>
          testData.extendedFieldKeys.createPast(1, 'withAccessRevoked').sorted())
        .afterResponse(page => {
          page.first(FieldKeyRevoke).getProp('state').should.be.false();
          return page;
        })
        .then(clickRevokeInMenu)
        .then(page => {
          page.first(FieldKeyRevoke).getProp('state').should.be.false();
        }));
  });

  it('revoke button is disabled for an app user whose access is revoked', () =>
    mockHttp()
      .mount(FieldKeyList)
      .respondWithData(() =>
        testData.extendedFieldKeys.createPast(1, 'withAccessRevoked').sorted())
      .afterResponse(page => {
        page.first('.dropdown-menu li').hasClass('disabled').should.be.true();
      }));

  it('standard button thinking things', () => {
    const fieldKey = testData.extendedFieldKeys.createPast(1, 'withAccess').last();
    const propsData = { fieldKey };
    return mockHttp()
      .mount(FieldKeyRevoke, { propsData })
      .request(confirmRevoke)
      .standardButton('.btn-danger');
  });

  describe('after successful response', () => {
    let app;
    beforeEach(() => mockRoute('/users/field-keys')
      .respondWithData(() =>
        testData.extendedFieldKeys.createPast(2, 'withAccess').sorted())
      .afterResponse(component => {
        app = component;
      })
      .request(() => clickRevokeInMenu(app)
        .then(confirmRevoke)
        .then(() => {
          const first = testData.extendedFieldKeys.sorted()[0];
          testData.extendedFieldKeys.update(first, () => {
            first.token = null;
          });
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
