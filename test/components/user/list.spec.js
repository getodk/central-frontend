import { RouterLinkStub } from '@vue/test-utils';

import Spinner from '../../../src/components/spinner.vue';
import UserRow from '../../../src/components/user/row.vue';

import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('UserList', () => {
  beforeEach(() => {
    mockLogin({ email: 'a@email.com', displayName: 'Alice' });
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
    link.text().should.equal('Alice');
    link.attributes().title.should.equal('Alice');
  });

  it('shows the email', () =>
    load('/users', { root: false }).then(component => {
      const td = component.get('.user-row .email');
      td.text().should.equal('a@email.com');
      td.attributes().title.should.equal('a@email.com');
    }));

  it('correctly renders the edit profile action', async () => {
    const component = await load('/users', { root: false });
    const row = component.getComponent(UserRow);
    const link = row.findAllComponents(RouterLinkStub).find(wrapper =>
      wrapper.element.closest('.edit-profile') != null);
    link.props().to.should.equal('/users/1/edit');
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

    selects[0].element.disabled.should.be.true();
    selects[1].element.disabled.should.be.false();

    should.exist(selects[0].attributes().title);
    should.not.exist(selects[1].attributes().title);
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
              select.element.disabled.should.be.true();
            })
            .respondWithSuccess()
            .afterResponse(component => {
              const select = component.findAll('.user-row select')[rowIndex];
              select.element.disabled.should.be.false();
            }));

        it('shows a spinner during the request', () =>
          loadUsersAndChangeRole({ rowIndex, selectValue })
            .beforeAnyResponse(component => {
              const row = component.findAllComponents(UserRow)[rowIndex];
              row.getComponent(Spinner).props().state.should.be.true();
            })
            .respondWithSuccess());

        it('shows a success alert after a successful response', () =>
          loadUsersAndChangeRole({ rowIndex, selectValue })
            .respondWithSuccess()
            .afterResponse(component => {
              component.should.alert('success', (message) => {
                message.should.containEql(`Person ${rowIndex}`);
                message.should.containEql(roleName);
              });
            }));
      });
    }
  });
});
