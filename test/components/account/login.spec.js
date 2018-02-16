/*
Copyright 2017 Super Adventure Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/nafundi/super-adventure/blob/master/NOTICE.

This file is part of Super Adventure. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of Super Adventure,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import { mount } from 'avoriaz';

import '../../setup';
import AccountLogin from '../../../lib/components/account/login.vue';
import Alert from '../../../lib/components/alert.vue';
import mockHttp from '../../http';
import { logOut, mockRouteThroughLogin, mockUser, submitLoginForm } from '../../session';
import { mockRoute, trigger } from '../../util';

describe('AccountLogin', () => {
  describe('user is logged out', () => {
    it('navbar indicates that the user is logged out', () =>
      mockRoute('/login').then(app => {
        const link = app.first('.navbar-right > li > a');
        link.text().trim().should.equal('Not Logged in');
      }));

    it('first field is focused', () => {
      const page = mount(AccountLogin, { attachToDocument: true });
      const field = page.first('#account-login-email');
      (document.activeElement === field.element).should.be.true();
    });

    it('standard button thinking things', () =>
      mockHttp()
        .mount(AccountLogin)
        .request(submitLoginForm)
        .standardButton('button[type="submit"]'));

    it('incorrect credentials result in error message', () =>
      mockHttp()
        .mount(AccountLogin)
        .request(submitLoginForm)
        .respondWithProblem(401.2)
        .afterResponse(page => {
          const alert = page.first(Alert);
          alert.getProp('state').should.be.true();
          alert.getProp('type').should.equal('danger');
          alert.getProp('message').should.equal('Incorrect email address and/or password.');
        }));
  });

  describe('after login', () => {
    afterEach(logOut);

    it('navigating to login redirects to forms list', () =>
      mockRouteThroughLogin('/users')
        .respondWithProblem()
        .complete()
        .request(app => app.vm.$router.push('/login'))
        .respondWithProblem()
        .afterResponse(app => app.vm.$route.path.should.equal('/forms')));

    it("navbar shows the user's display name", () =>
      mockRouteThroughLogin('/users')
        .respondWithData([mockUser()])
        .afterResponses(app => {
          const link = app.first('.navbar-right > li > a');
          link.text().trim().should.equal(mockUser().email);
        }));

    describe("after clicking the user's display name", () => {
      let app;
      let dropdown;

      // We need to attach the component to the document, because some of
      // Bootstrap's dropdown listeners are on the document.
      beforeEach(() => mockRouteThroughLogin('/users', { attachToDocument: true })
        .respondWithData([mockUser()])
        .afterResponses(component => {
          app = component;
          dropdown = app.first('.navbar-right .dropdown');
          // Have the event bubble so that it triggers Bootstrap's dropdown
          // listeners on the document.
          return trigger('click', dropdown.first('.dropdown-toggle'), true);
        }));

      it('a menu is shown', () => {
        dropdown.is('.open').should.be.true();
      });

      describe('after clicking logout button', () => {
        beforeEach(() => mockHttp()
          .request(() => {
            trigger('click', dropdown.first('.dropdown-menu > li > a'));
          })
          .respondWithProblem());

        it('user is logged out', () => {
          app.vm.$session.loggedOut().should.be.true();
        });

        it('user is redirected to login', () => {
          app.vm.$route.path.should.equal('/login');
        });

        it('success message is shown', () => {
          const alert = app.first(Alert);
          alert.getProp('state').should.be.true();
          alert.getProp('type').should.equal('success');
          alert.getProp('message').should.equal('You have logged out successfully.');
        });
      });
    });
  });
});
