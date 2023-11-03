import sinon from 'sinon';

import { afterNextNavigation, arrayQuery, createScrollBehavior, forceReplace, routeProps } from '../../src/util/router';

import createTestContainer from '../util/container';
import testData from '../data';
import { load } from '../util/http';
import { mockLogin } from '../util/session';
import { testRouter } from '../util/router';
import { wait } from '../util/util';

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

  // We try to test this function using mostly integration tests. Where that's
  // more difficult, we use unit tests.
  describe('createScrollBehavior()', () => {
    beforeEach(() => {
      mockLogin();
      testData.extendedEntities.createPast(1, { uuid: 'e' });
      testData.extendedAudits.createPast(1, {
        action: 'entity.create',
        details: {}
      });
      for (let version = 2; version <= 50; version += 1) {
        testData.extendedEntityVersions.createPast(1);
        testData.extendedAudits.createPast(1, {
          action: 'entity.update.version',
          details: {}
        });
      }
    });

    // Waits enough time for scrolling to occur.
    const waitForScroll = (clock) => {
      clock.tick(250);
      // I'm not sure why wait() is needed in addition to clock.tick(). Maybe
      // scrolling is run as a task rather than a microtask?
      return wait();
    };
    const pxTo = (wrapper) =>
      Math.floor(wrapper.element.getBoundingClientRect().y);

    it('does not scroll if there is no route hash', async () => {
      const clock = sinon.useFakeTimers(Date.now());
      await load('/projects/1/entity-lists/trees/entities/e', {
        attachTo: document.body
      });
      window.scrollY.should.equal(0);
      // Even after waiting, the page should not scroll.
      await waitForScroll(clock);
      window.scrollY.should.equal(0);
    });

    it('immediately scrolls to a target that exists in the DOM', async () => {
      sinon.useFakeTimers(Date.now());
      const app = await load('/projects/1/entity-lists/trees/entities/e', {
        attachTo: document.body
      });

      // Scroll to v40.
      await app.vm.$router.push('/projects/1/entity-lists/trees/entities/e#v40');
      // We don't wait 250 milliseconds, but we do seem to need to give tasks
      // the chance to run.
      await wait();
      const yForV40 = window.scrollY;
      yForV40.should.be.above(0);
      pxTo(app.get('[data-scroll-id="v40"]')).should.equal(10);

      // Scroll to v20 even farther below.
      await app.vm.$router.push('/projects/1/entity-lists/trees/entities/e#v20');
      await wait();
      window.scrollY.should.be.above(yForV40);
      pxTo(app.get('[data-scroll-id="v20"]')).should.equal(10);
    });

    it('waits for the scroll target to appear in the DOM', async () => {
      const clock = sinon.useFakeTimers(Date.now());
      await load('/projects/1/entity-lists/trees/entities/e#v40', {
        attachTo: document.body
      });
      // The first attempt to scroll happened around when requests were sent,
      // before the page was fully rendered. As a result, there was no initial
      // scrolling: we need to wait for the second attempt to scroll.
      window.scrollY.should.equal(0);
      await waitForScroll(clock);
      window.scrollY.should.be.above(0);
    });

    it('does not scroll twice', async () => {
      const clock = sinon.useFakeTimers(Date.now());
      await load('/projects/1/entity-lists/trees/entities/e#v40', {
        attachTo: document.body
      });
      await waitForScroll(clock);
      window.scrollY.should.be.above(0);
      window.scrollTo(0, 0);
      window.scrollY.should.equal(0);
      await waitForScroll(clock);
      window.scrollY.should.equal(0);
    });

    it('stops waiting after some amount of time', () => {
      const clock = sinon.useFakeTimers(Date.now());
      return load('/projects/1/entity-lists/trees/entities/e#v40', {
        attachTo: document.body
      })
        .beforeAnyResponse(() => {
          clock.tick(240000);
        })
        .respondWithData(() => 'v2023.5') // version.txt
        .afterResponses(async () => {
          await waitForScroll(clock);
          window.scrollY.should.equal(0);
        });
    });

    describe('new navigation is confirmed before target appears', () => {
      it('does not scroll to the previous target', () => {
        const clock = sinon.useFakeTimers(Date.now());
        return load('/projects/1/entity-lists/trees/entities/e#v40', {
          attachTo: document.body
        })
          .beforeAnyResponse(app =>
            // Navigate to a route without a hash.
            app.vm.$router.push('/projects/1/entity-lists/trees/entities/e'))
          .afterResponses(async () => {
            await waitForScroll(clock);
            window.scrollY.should.equal(0);
          });
      });

      it('scrolls to the new target', () => {
        const clock = sinon.useFakeTimers(Date.now());
        return load('/projects/1/entity-lists/trees/entities/e#v40', {
          attachTo: document.body
        })
          .beforeAnyResponse(app =>
            app.vm.$router.push('/projects/1/entity-lists/trees/entities/e#v20'))
          .afterResponses(async (app) => {
            await waitForScroll(clock);
            window.scrollY.should.be.above(0);
            pxTo(app.get('[data-scroll-id="v20"]')).should.equal(10);
          });
      });
    });

    describe('invalid hash', () => {
      const cases = [
        '',
        '#',
        // This would break the CSS selector in createScrollBehavior().
        '#"'
      ];
      for (const hash of cases) {
        it(`does not scroll if the hash is [${hash}]`, () => {
          const to = { path: '/users', hash };
          const from = { path: '/' };
          should.not.exist(createScrollBehavior()(to, from, null));
        });
      }
    });
  });
});
