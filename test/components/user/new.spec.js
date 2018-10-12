import UserList from '../../../lib/components/user/list.vue';
import UserNew from '../../../lib/components/user/new.vue';
import testData from '../../data';
import { fillForm, trigger } from '../../util';
import { mockHttp, mockRoute } from '../../http';
import { mockLogin } from '../../session';

const clickCreateButton = (wrapper) =>
  trigger.click(wrapper, '#user-list-new-button');
const submitForm = (wrapper) =>
  fillForm(wrapper, [['[type="email"]', testData.administrators.createNew().email]])
    .then(() => trigger.submit(wrapper, '#user-new form'));

describe('UserNew', () => {
  beforeEach(mockLogin);

  describe('modal', () => {
    it('is initially hidden', () =>
      mockHttp()
        .mount(UserList)
        .respondWithData(() => testData.administrators.sorted())
        .afterResponse(page => {
          page.first(UserNew).getProp('state').should.be.false();
        }));

    describe('after button click', () => {
      it('modal is shown', () =>
        mockHttp()
          .mount(UserList)
          .respondWithData(() => testData.administrators.sorted())
          .afterResponse(clickCreateButton)
          .then(page => page.first(UserNew).getProp('state').should.be.true()));

      it('email input is focused', () =>
        mockRoute('/users', { attachToDocument: true })
          .respondWithData(() => testData.administrators.sorted())
          .afterResponse(clickCreateButton)
          .then(app => app.first('#user-new [type="email"]').should.be.focused()));
    });
  });

  it('standard button thinking things', () =>
    mockHttp()
      .mount(UserNew)
      .request(submitForm)
      .standardButton());

  describe('after successful submit', () => {
    let app;
    beforeEach(() => mockRoute('/users')
      .respondWithData(() => testData.administrators.sorted())
      .afterResponse(component => {
        app = component;
      })
      .request(() => clickCreateButton(app).then(submitForm))
      .respondWithData(() => testData.administrators.last())
      .respondWithData(() => testData.administrators.sorted()));

    it('modal is hidden', () => {
      app.first(UserNew).getProp('state').should.be.false();
    });

    it('table has the correct number of rows', () => {
      app.find('#user-list-table tbody tr').length.should.equal(2);
    });

    it('success message is shown', () => {
      app.should.alert('success');
    });
  });
});
