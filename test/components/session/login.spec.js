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
import Vue from 'vue';
import { mount } from 'avoriaz';

import '../../setup';
import Alert from '../../../lib/components/alert.vue';
import SessionLogin from '../../../lib/components/session/login.vue';
import mockHttp from '../../http';
import { detachFromDocument, mockRoute } from '../../util';
import { mockRouteThroughLogin, mockUser, resetSession, submitLoginForm } from '../../session';

describe('SessionLogin', () => {
  describe('user is logged out', () => {
    it('navbar indicates that the user is logged out', () =>
      mockRoute('/login').then(app => {
        const link = app.first('.navbar-right > li > a');
        link.text().trim().should.equal('Not Logged in');
      }));

    it('first field is focused', () => {
      const page = mount(SessionLogin, { attachToDocument: true });
      const field = page.first('#session-login-email');
      const isFocused = document.activeElement === field.element;
      detachFromDocument(page);
      isFocused.should.be.true();
    });

    it('standard button thinking things', () =>
      mockHttp()
        .mount(SessionLogin)
        .request(page => submitLoginForm(page))
        .standardButton('button[type="submit"]'));

    it('incorrect credentials result in error message', () =>
      mockHttp()
        .mount(SessionLogin)
        .request(page => submitLoginForm(page))
        .respondWithProblem(401.2)
        .afterResponse(page => {
          const alert = page.first(Alert);
          alert.getProp('state').should.be.true();
          alert.getProp('type').should.equal('danger');
          alert.getProp('message').should.equal('Incorrect email address and/or password.');
        }));
  });

  describe('after login', () => {
    afterEach(resetSession);

    it('navigating to login redirects to forms list', () =>
      mockRouteThroughLogin('/users').then(app => {
        app.vm.$router.push('/login');
        app.vm.$route.path.should.equal('/forms');
      }));

    it("navbar shows the user's display name", () =>
      mockRouteThroughLogin('/users').then(app => {
        const link = app.first('.navbar-right > li > a');
        link.text().trim().should.equal(mockUser().email);
      }));

    describe("after clicking the user's display name", () => {
      let app;
      let dropdown;

      // We need to attach the component to the document, because Bootstrap's
      // dropdown listeners are attached to the document.
      beforeEach(() => mockRouteThroughLogin('/users', { attachToDocument: true })
        .then(component => {
          app = component;
          dropdown = app.first('.navbar-right .dropdown');
          // Using jQuery click() rather than avoriaz trigger(), because
          // trigger() dispatches an event that does not bubble, and Bootstrap's
          // dropdown listeners are attached to the document.
          $(dropdown.element).find('.dropdown-toggle').click();
        }));
      afterEach(() => detachFromDocument(app));

      it('a menu is shown', () => {
        dropdown.is('.open').should.be.true();
      });

      describe('after clicking logout button', () => {
        beforeEach(() => {
          dropdown.first('.dropdown-menu > li > a').trigger('click');
          return Vue.nextTick();
        });

        it('user is logged out', () => {
          Vue.prototype.$session.loggedOut().should.be.true();
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
