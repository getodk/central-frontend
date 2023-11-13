import sinon from 'sinon';

import { afterNextNavigation, arrayQuery, forceReplace, routeProps } from '../../src/util/router';

import createTestContainer from '../util/container';
import testData from '../data';
import { load } from '../util/http';
import { mockLogin } from '../util/session';
import { testRouter } from '../util/router';

describe('util/router', () => {
  describe('arrayQuery()', () => {
    it('returns an empty array for null', () => {
      arrayQuery(null).should.eql([]);
    });

    it('wraps a string in an array', () => {
      arrayQuery('foo').should.eql(['foo']);
    });

    it('filters out null', () => {
      arrayQuery(['foo', null, 'bar']).should.eql(['foo', 'bar']);
    });

    it('deduplicates values', () => {
      arrayQuery(['foo', 'foo']).should.eql(['foo']);
    });

    it('validates values', () => {
      const validator = (value) => value !== 'bar';
      arrayQuery(['foo', 'bar'], { validator }).should.eql(['foo']);
    });

    it('validates a string', () => {
      const validator = (value) => value !== 'bar';
      arrayQuery('bar', { validator }).should.eql([]);
    });

    it('returns a default', () => {
      arrayQuery([], { default: ['foo'] }).should.eql(['foo']);
    });

    it('returns a default for null', () => {
      arrayQuery(null, { default: ['foo'] }).should.eql(['foo']);
    });

    it('calls a default function', () => {
      arrayQuery([], { default: () => ['foo'] }).should.eql(['foo']);
    });
  });

  describe('routeProps()', () => {
    const { router } = createTestContainer({ router: testRouter() });
    const route = router.resolve('/projects/1');

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

  describe('afterNextNavigation()', () => {
    beforeEach(mockLogin);

    it('runs the callback after the next navigation', () => {
      const callback = sinon.fake();
      return load('/')
        .afterResponses(app => {
          afterNextNavigation(app.vm.$router, callback);
        })
        .load('/users')
        .afterResponses(() => {
          callback.called.should.be.true();
          const args = callback.args[0];
          args[0].path.should.equal('/users');
          args[1].path.should.equal('/');
        });
    });

    it('does not run the callback after a later navigation', () => {
      const callback = sinon.fake();
      return load('/')
        .afterResponses(app => {
          afterNextNavigation(app.vm.$router, callback);
        })
        .load('/users')
        .complete()
        .load('/account/edit')
        .afterResponses(() => {
          callback.callCount.should.equal(1);
        });
    });

    it('can run multiple callbacks', () => {
      const callbacks = [sinon.fake(), sinon.fake()];
      return load('/')
        .afterResponses(app => {
          afterNextNavigation(app.vm.$router, callbacks[0]);
          afterNextNavigation(app.vm.$router, callbacks[1]);
        })
        .load('/users')
        .afterResponses(() => {
          callbacks[0].called.should.be.true();
          callbacks[1].called.should.be.true();
        });
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
