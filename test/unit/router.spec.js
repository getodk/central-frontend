import sinon from 'sinon';

import router from '../../src/router';
import testData from '../data';
import { forceReplace, routeProps } from '../../src/util/router';
import { load } from '../util/http';
import { mockLogin } from '../util/session';
import { trigger } from '../util/event';

describe('util/router', () => {
  describe('forceReplace()', () => {
    beforeEach(mockLogin);

    it('navigates to the location', () => {
      testData.extendedProjects.createPast(1);
      return load('/')
        .complete()
        .request(app => {
          forceReplace(app.vm.$router, app.vm.$store, '/users');
        })
        .respondFor('/users')
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/users');
        });
    });

    it('does not show a prompt if there are unsaved changes', () => {
      testData.extendedProjects.createPast(1);
      testData.extendedForms.createPast(1, { state: 'open' });
      const fake = sinon.fake();
      sinon.replace(window, 'confirm', fake);
      return load('/projects/1/form-access')
        .afterResponses(app =>
          trigger.changeValue(app, '#project-form-access-table select', 'closed'))
        .request(app => {
          forceReplace(app.vm.$router, app.vm.$store, '/');
        })
        .respondFor('/')
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/');
          fake.called.should.be.false();
        });
    });
  });

  describe('routeProps()', () => {
    const { route } = router.resolve('/projects/1');

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
});
