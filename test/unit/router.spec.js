import sinon from 'sinon';

import { forceReplace, routeProps } from '../../src/util/router';

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

    describe('unsaved changes', () => {
      it('does not show a prompt', async () => {
        const container = createTestContainer({ router: testRouter() });
        const { unsavedChanges } = container;
        unsavedChanges.plus(1);
        const confirm = sinon.fake();
        sinon.replace(window, 'confirm', confirm);
        await forceReplace(container, '/');
        confirm.called.should.be.false();
      });

      it('resets unsavedChanges', async () => {
        const container = createTestContainer({ router: testRouter() });
        const { unsavedChanges } = container;
        unsavedChanges.plus(1);
        await forceReplace(container, '/');
        unsavedChanges.count.should.equal(0);
      });
    });
  });
});
