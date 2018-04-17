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
import mockHttp from '../../http';
import testData from '../../data';
import { mockRoute, trigger } from '../../util';
import { mockRouteThroughLogin, submitLoginForm } from '../../session';

describe('AccountLogin', () => {
  describe('user is logged out', () => {
    it('navbar indicates that the user is logged out', () =>
      mockRoute('/login').then(app => {
        const link = app.first('.navbar-right > li > a');
        link.text().trim().should.equal('Not Logged in');
      }));

    it('first field is focused', () =>
      // We need mockRoute() and not just mockHttp(), because AccountLogin uses
      // $route at render.
      mockRoute('/login', { attachToDocument: true }).then(app => {
        app.first('#account-login input[type="email"]').should.be.focused();
      }));

    it('standard button thinking things', () =>
      mockRoute('/login')
        .complete()
        .request(submitLoginForm)
        .standardButton());

    it('incorrect credentials result in error message', () =>
      mockRoute('/login')
        .complete()
        .request(submitLoginForm)
        .respondWithProblem(401.2)
        .afterResponse(app => {
          app.should.alert('danger', 'Incorrect email address and/or password.');
        }));

    it('clicking the reset password button navigates to that page', () =>
      mockRoute('/login')
        .then(app => trigger('click', app.first('.panel-footer .btn-link'))
          .then(() => app.vm.$route.path.should.equal('/reset-password'))));
  });

  describe('after login', () => {
    it('navigating to login redirects to forms list', () =>
      mockRouteThroughLogin('/users')
        .respondWithProblem()
        .complete()
        .request(app => app.vm.$router.push('/login'))
        .respondWithProblem()
        .afterResponse(app => app.vm.$route.path.should.equal('/forms')));

    it("navbar shows the user's display name", () =>
      mockRouteThroughLogin('/users')
        .respondWithData(() => testData.administrators.sorted())
        .afterResponse(app => {
          const link = app.first('.navbar-right > li > a');
          link.text().trim().should.equal(testData.administrators.first().email);
        }));

    describe("after clicking the user's display name", () => {
      let app;
      let dropdown;

      // We need to attach the component to the document, because some of
      // Bootstrap's dropdown listeners are on the document.
      beforeEach(() => mockRouteThroughLogin('/users', { attachToDocument: true })
        .respondWithData(() => testData.administrators.sorted())
        .afterResponse(component => {
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
          app.should.alert('success', 'You have logged out successfully.');
        });
      });
    });
  });
});
