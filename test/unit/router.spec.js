import sinon from 'sinon';

import store from '../../src/store';
import { confirmUnsavedChanges, forceReplace, routeProps } from '../../src/util/router';

import createTestContainer from '../util/container';
import testData from '../data';
import { load } from '../util/http';
import { mockLogin } from '../util/session';
import { resolveRoute, testRouter } from '../util/router';

describe('util/router', () => {
  describe('routeProps()', () => {
    const route = resolveRoute('/projects/1');

    it('returns an empty object if props is undefined', () => {
      routeProps(route, undefined).should.eql({});
    });

    it('returns an empty object if props is false', () => {
      routeProps(route, false).should.eql({});
    });

    it('returns the route params if props is true', () => {
      routeProps(route, true).should.eql({ projectId: '1' });
    });

    it('returns an object passed as props', () => {
      const obj = { x: 1, y: 2 };
      routeProps(route, obj).should.equal(obj);
    });

    it('returns the result of a function passed as props', () => {
      const props = routeProps(route, (r) => ({ x: 1, y: 2, ...r.params }));
      props.should.eql({ x: 1, y: 2, projectId: '1' });
    });
  });

  describe('forceReplace()', () => {
    beforeEach(mockLogin);

    it('navigates to the location', () => {
      testData.extendedProjects.createPast(1);
      return load('/')
        .complete()
        .request(app => forceReplace(app.vm.$container, '/users'))
        .respondFor('/users')
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/users');
        });
    });

    it('returns a promise', () => {
      const container = createTestContainer({ router: testRouter() });
      forceReplace(container, '/').should.be.a.Promise();
    });

    it('does not show a prompt if there are unsaved changes', () => {
      testData.extendedProjects.createPast(1);
      testData.extendedForms.createPast(1, { state: 'open' });
      const fake = sinon.fake();
      sinon.replace(window, 'confirm', fake);
      return load('/projects/1/form-access')
        .afterResponses(app =>
          app.get('#project-form-access-table select').setValue('closed'))
        .request(app => forceReplace(app.vm.$container, '/'))
        .respondFor('/')
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/');
          fake.called.should.be.false();
        });
    });
  });

  describe('confirmUnsavedChanges()', () => {
    it('returns true if there are no unsaved changes', () => {
      confirmUnsavedChanges(store).should.be.true();
    });

    it('returns true if the user confirms', () => {
      store.commit('setUnsavedChanges', true);
      sinon.replace(window, 'confirm', () => true);
      confirmUnsavedChanges(store).should.be.true();
    });

    it('returns false if the user does not confirm', () => {
      store.commit('setUnsavedChanges', true);
      sinon.replace(window, 'confirm', () => false);
      confirmUnsavedChanges(store).should.be.false();
    });
  });
});
