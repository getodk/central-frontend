import UserEdit from '../../../../src/components/user/edit.vue';
import UserEditPassword from '../../../../src/components/user/edit/password.vue';
import testData from '../../../data';
import { fillForm, submitForm, trigger } from '../../../util/event';
import { mockHttp, mockRoute } from '../../../util/http';
import { mockLogin } from '../../../util/session';
import { mountAndMark } from '../../../util/lifecycle';

const submitPasswords = (wrapper, { match, validSizePass = true }) =>
  submitForm(wrapper, '#user-edit-password form', [
    ['#user-edit-password-old-password', 'testPasswordX'],
    ['#user-edit-password-new-password', validSizePass ? 'testPasswordY' : 'y'],
    ['#user-edit-password-confirm', match ? validSizePass ? 'testPasswordY' : 'y'
      : validSizePass ? 'testPasswordZ' : 'z']
  ]);

describe('UserEditPassword', () => {
  beforeEach(mockLogin);

  it('resets after a route update', () =>
    mockRoute('/users/1/edit')
      .respondWithData(() => testData.standardUsers.last())
      .afterResponse(app => {
        const selectors = [
          '#user-edit-password-old-password',
          '#user-edit-password-new-password',
          '#user-edit-password-confirm'
        ];
        for (const selector of selectors)
          app.first(selector).element.value.should.equal('');
        return fillForm(app.first('#user-edit-password form'), [
          ['#user-edit-password-old-password', 'x'],
          ['#user-edit-password-new-password', 'y'],
          ['#user-edit-password-confirm', 'y']
        ]);
      })
      .route('/users/2/edit')
      .respondWithData(() => testData.standardUsers.createPast(1).last())
      .complete()
      .route('/users/1/edit')
      .respondWithData(() => testData.standardUsers.first())
      .afterResponse(app => {
        const selectors = [
          '#user-edit-password-old-password',
          '#user-edit-password-new-password',
          '#user-edit-password-confirm'
        ];
        for (const selector of selectors)
          app.first(selector).element.value.should.equal('');
      }));

  it("does not render form if it is not current user's own account", () =>
    mockHttp()
      .mount(UserEdit, {
        propsData: { id: '2' }
      })
      .respondWithData(() => testData.standardUsers.createPast(1).last())
      .afterResponse(component => {
        const panelBody = component.first('#user-edit-password .panel-body');
        panelBody.find('form').length.should.equal(0);
      }));

  it('standard button thinking things', () =>
    mockRoute('/account/edit')
      .respondWithData(() => testData.standardUsers.first())
      .complete()
      .request(app => submitPasswords(app, { match: true }))
      .standardButton('#user-edit-password button'));

  it('shows a success alert after a successful submit', () =>
    mockRoute('/account/edit')
      .respondWithData(() => testData.standardUsers.first())
      .complete()
      .request(app => submitPasswords(app, { match: true }))
      .respondWithSuccess()
      .afterResponse(app => {
        app.should.alert('success');
      }));

  describe('new passwords do not match', () => {
    it('shows a danger alert', () =>
      mockRoute('/account/edit')
        .respondWithData(() => testData.standardUsers.first())
        .afterResponse(app => submitPasswords(app, { match: false }))
        .then(app => {
          app.should.alert('danger');
        }));

    it('adds .has-error to the fields', () => {
      const component = mountAndMark(UserEditPassword, {
        requestData: { user: testData.standardUsers.first() }
      });
      return submitPasswords(component, { match: false }).then(() => {
        const formGroups = component.find('.form-group');
        formGroups.length.should.equal(3);
        formGroups[1].hasClass('has-error').should.be.true();
        formGroups[2].hasClass('has-error').should.be.true();
      });
    });

    it('removes .has-error once the passwords match', () =>
      mockHttp()
        .mount(UserEditPassword, {
          requestData: { user: testData.standardUsers.first() }
        })
        .request(async (component) => {
          await trigger.submit(component, '#user-edit-password form', [
            ['#user-edit-password-old-password', 'testPasswordX'],
            ['#user-edit-password-new-password', 'testPasswordY'],
            ['#user-edit-password-confirm', 'testPasswordZ']
          ]);
          await trigger.submit(component, '#user-edit-password form', [
            ['#user-edit-password-confirm', 'testPasswordY']
          ]);
        })
        .beforeAnyResponse(component => {
          const formGroups = component.find('.form-group');
          formGroups[1].hasClass('has-error').should.be.false();
          formGroups[2].hasClass('has-error').should.be.false();
        })
        .respondWithSuccess());
  });

  describe('password length does not meet the criteria', () => {
    it('adds .has-error to the fields when password length < 10', () => {
      const component = mountAndMark(UserEditPassword, {
        requestData: { user: testData.standardUsers.first() }
      });
      return submitPasswords(component, { match: false, validSizePass: false }).then(() => {
        const formGroups = component.find('.form-group');
        formGroups.length.should.equal(3);
        formGroups[1].hasClass('has-error').should.be.true();
        formGroups[2].hasClass('has-error').should.be.true();
      });
    });

    it('removes .has-error once the passwords length > 10', () =>
      mockHttp()
        .mount(UserEditPassword, {
          requestData: { user: testData.standardUsers.first() }
        })
        .request(async (component) => {
          await trigger.submit(component, '#user-edit-password form', [
            ['#user-edit-password-old-password', 'testPasswordX'],
            ['#user-edit-password-new-password', 'y'],
            ['#user-edit-password-confirm', 'testPasswordY']
          ]);
          await trigger.submit(component, '#user-edit-password form', [
            ['#user-edit-password-new-password', 'testPasswordY']
          ]);
        })
        .beforeAnyResponse(component => {
          const formGroups = component.find('.form-group');
          formGroups.length.should.equal(3);
          formGroups[1].hasClass('has-error').should.be.false();
          formGroups[2].hasClass('has-error').should.be.false();
        })
        .respondWithSuccess());
  });
});
