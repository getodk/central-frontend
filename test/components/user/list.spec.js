import { RouterLinkStub } from '@vue/test-utils';

import Spinner from '../../../src/components/spinner.vue';
import UserRow from '../../../src/components/user/row.vue';

import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';
import { setLuxon } from '../../util/date-time';

describe('UserList', () => {
  beforeEach(() => {
    mockLogin({ email: 'a@email.com', displayName: 'Alice Allison' });
  });

  it('sends the correct initial requests', () =>
    load('/users', { root: false }).testRequests([
      { url: '/v1/users' },
      { url: '/v1/assignments/admin' }
    ]));

  it('correctly renders the display name', async () => {
    const component = await load('/users', { root: false });
    const link = component.getComponent(UserRow).getComponent(RouterLinkStub);
    should.exist(link.element.closest('.display-name'));
    link.props().to.should.equal('/users/1/edit');
    link.text().should.equal('Alice Allison');
    await link.should.have.textTooltip();
  });

  it('shows the email', async () => {
    const component = await load('/users', { root: false });
    const span = component.get('.user-row .email span');
    span.text().should.equal('a@email.com');
    await span.should.have.textTooltip();
  });

  it('correctly renders the edit profile action', async () => {
    const component = await load('/users', { root: false });
    const row = component.getComponent(UserRow);
    const link = row.findAllComponents(RouterLinkStub).find(wrapper =>
      wrapper.element.closest('.edit-profile') != null);
    link.props().to.should.equal('/users/1/edit');
  });

  it('displays user last login date when available', async () => {
    setLuxon({ defaultZoneName: 'UTC' });
    const lastLoginAt = '2023-12-01T10:00:00.000Z';
    testData.extendedUsers.createPast(1, {
      displayName: 'Test User',
      email: 'test@example.com',
      lastLoginAt
    });
    const component = await load('/users', { root: false });
    const rows = component.findAll('.user-row .last-active');
    rows[1].text().should.equal('2023/12/01 10:00');
  });

  it('displays "Invitation Pending" for users who have never logged in', async () => {
    testData.extendedUsers.createPast(1, {
      displayName: 'New User',
      email: 'new@example.com'
      // lastLoginAt is undefined
    });
    const component = await load('/users', { root: false });
    const lastActive = component.get('.user-row .last-active');
    lastActive.text().should.equal('Invitation Pending');
  });

  it('sets the roles', async () => {
    testData.extendedUsers.createPast(1, {
      email: 'b@email.com',
      role: 'none'
    });
    const component = await load('/users', { root: false }, {
      adminIds: () => [testData.toActor(testData.standardUsers.first())]
    });
    const selects = component.findAll('.user-row select');
    selects.map(select => select.element.value).should.eql(['admin', '']);
  });

  it('disables the role select for the current user', async () => {
    testData.extendedUsers.createPast(1, { email: 'b@email.com' });
    const component = await load('/users', { root: false });
    const selects = component.findAll('.user-row select');

    selects[0].attributes('aria-disabled').should.equal('true');
    selects[1].attributes('aria-disabled').should.equal('false');

    selects[0].should.have.ariaDescription('You may not edit your own Sitewide Role.');
    await selects[0].should.have.tooltip();
    selects[1].should.not.have.ariaDescription();
    await selects[1].should.not.have.tooltip();
  });

  describe('changing a role', () => {
    const loadUsersAndChangeRole = ({ rowIndex, selectValue }) => {
      testData.extendedUsers
        .createPast(1, {
          displayName: 'Person 1',
          email: 'b@email.com',
          role: 'admin'
        })
        .createPast(1, {
          displayName: 'Person 2',
          email: 'c@email.com',
          role: 'none'
        });
      return load('/users', { root: false }, {
        adminIds: () =>
          testData.extendedUsers.sorted().slice(0, 2).map(testData.toActor)
      })
        .complete()
        .request(component =>
          component.findAll('.user-row select')[rowIndex].setValue(selectValue));
    };

    // Array of test cases, where each case is an array with the following
    // structure:
    //
    //   [row index, role name, new select value, request method]
    //
    const cases = [
      [1, 'None', 'none', 'DELETE'],
      [2, 'Administrator', 'admin', 'POST']
    ];
    for (const [rowIndex, roleName, selectValue, method] of cases) {
      describe(`changing to ${selectValue}`, () => {
        it('sends the request using the correct method', () =>
          loadUsersAndChangeRole({ rowIndex, selectValue })
            .beforeEachResponse((_, config) => {
              config.method.should.equal(method);
            })
            .respondWithSuccess());

        it('disables the select during the request', () =>
          loadUsersAndChangeRole({ rowIndex, selectValue })
            .beforeAnyResponse(component => {
              const select = component.findAll('.user-row select')[rowIndex];
              select.attributes('aria-disabled').should.equal('true');
            })
            .respondWithSuccess()
            .afterResponse(component => {
              const select = component.findAll('.user-row select')[rowIndex];
              select.attributes('aria-disabled').should.equal('false');
            }));

        it('shows a spinner during the request', () =>
          loadUsersAndChangeRole({ rowIndex, selectValue })
            .beforeAnyResponse(component => {
              const row = component.findAllComponents(UserRow)[rowIndex];
              row.getComponent(Spinner).props().state.should.be.true;
            })
            .respondWithSuccess());

        it('shows a success alert after a successful response', () =>
          loadUsersAndChangeRole({ rowIndex, selectValue })
            .respondWithSuccess()
            .afterResponse(component => {
              component.should.alert('success', (message) => {
                message.should.include(`Person ${rowIndex}`);
                message.should.include(roleName);
              });
            }));
      });
    }
  });
});
