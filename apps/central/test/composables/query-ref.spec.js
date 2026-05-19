import sinon from 'sinon';

import useQueryRef from '../../src/composables/query-ref';

import { load } from '../util/http';
import { mockLogin } from '../util/session';
import { wait } from '../util/util';
import { withSetup } from '../util/lifecycle';

const options = {
  exclamation: {
    fromQuery: ({ x }) => `${x}!`,
    toQuery: (value) => ({ x: value.replace('!', '') })
  },
  comma: {
    fromQuery: ({ x, y }) => `${x},${y}`,
    toQuery: (value) => {
      const [x, y] = value.split(',');
      return { x, y };
    }
  }
};

describe('useQueryRef()', () => {
  beforeEach(mockLogin);

  it('initializes the value of the ref using fromQuery()', async () => {
    const app = await load('/?x=a');
    const result = withSetup(() => useQueryRef(options.exclamation), {
      container: app.vm.$container
    });
    result.value.should.equal('a!');
  });

  it('changes value of ref after a change to any query parameter used in fromQuery()', async () => {
    const app = await load('/?x=a&y=b');
    const result = withSetup(() => useQueryRef(options.comma), {
      container: app.vm.$container
    });
    result.value.should.equal('a,b');
    await app.vm.$router.push('/?x=c&y=b');
    result.value.should.equal('c,b');
    await app.vm.$router.push('/?x=c&y=d');
    result.value.should.equal('c,d');
  });

  // https://github.com/getodk/central/issues/756
  it('does not change value of ref after route path changes', async () => {
    let result;
    return load('/?x=a&y=b')
      .afterResponses(app => {
        result = withSetup(() => useQueryRef(options.comma), {
          container: app.vm.$container
        });
        result.value.should.equal('a,b');
      })
      .load('/users?x=c&y=d')
      .afterResponses(() => {
        result.value.should.equal('a,b');
      });
  });

  describe('change to an irrelevant query parameter', () => {
    it('does not change the value of the ref', async () => {
      // `z` is the irrelevant query parameter that the ref doesn't use.
      const app = await load('/?x=a&z=b');
      const fromQuery = ({ x }) => ({ someProp: x });
      const toQuery = ({ someProp }) => ({ x: someProp });
      const result = withSetup(() => useQueryRef({ fromQuery, toQuery }), {
        container: app.vm.$container
      });
      const obj = result.value;
      obj.should.eql({ someProp: 'a' });
      await app.vm.$router.push('/?x=a&z=c');
      result.value.should.equal(obj);
    });

    it('does not change value of ref even if fromQuery() uses an array parameter', async () => {
      const app = await load('/?x=a&x=b&z=c');
      const fromQuery = ({ x }) => ({ first: x[0], second: x[1] });
      const toQuery = ({ first, second }) => ({ x: [first, second] });
      const result = withSetup(() => useQueryRef({ fromQuery, toQuery }), {
        container: app.vm.$container
      });
      const obj = result.value;
      obj.should.eql({ first: 'a', second: 'b' });
      await app.vm.$router.push('/?x=a&x=b&z=d');
      result.value.should.equal(obj);
    });
  });

  describe('setting the value of the ref', () => {
    it('persists the new value', async () => {
      const app = await load('/?x=a');
      const result = withSetup(() => useQueryRef(options.exclamation), {
        container: app.vm.$container
      });
      result.value = 'b!';
      result.value.should.equal('b!');
    });

    it('updates query parameters', async () => {
      const app = await load('/?x=a&y=b');
      const result = withSetup(() => useQueryRef(options.comma), {
        container: app.vm.$container
      });
      result.value = 'c,d';
      // Wait a moment for the navigation.
      await wait();
      app.vm.$route.query.should.eql({ x: 'c', y: 'd' });
    });

    it('removes a query parameter that is null', async () => {
      const app = await load('/?x=a&y=b');
      const fromQuery = ({ x, y }) =>
        [x, y].filter(value => value != null).join(',');
      const toQuery = (value) => {
        const split = value.split(',');
        if (split.length === 0) return { x: null, y: null };
        if (split.length === 1) return { x: split[0], y: null };
        return { x: split[0], y: split[1] };
      };
      const result = withSetup(() => useQueryRef({ fromQuery, toQuery }), {
        container: app.vm.$container
      });
      result.value.should.equal('a,b');
      result.value = 'a';
      await wait();
      app.vm.$route.query.should.eql({ x: 'a' });
    });

    it('preserves other query parameters', async () => {
      const app = await load('/?x=a&z=b');
      const result = withSetup(() => useQueryRef(options.exclamation), {
        container: app.vm.$container
      });
      result.value = 'c!';
      await wait();
      app.vm.$route.query.should.eql({ x: 'c', z: 'b' });
    });

    it('preserves the path', async () => {
      const app = await load('/account/edit?x=a');
      const result = withSetup(() => useQueryRef(options.exclamation), {
        container: app.vm.$container
      });
      result.value = 'b!';
      await wait();
      app.vm.$route.fullPath.should.equal('/account/edit?x=b');
    });

    it('does not navigate if value of ref is set to its current value', async () => {
      const app = await load('/?x=a');
      const result = withSetup(() => useQueryRef(options.exclamation), {
        container: app.vm.$container
      });
      const fake = sinon.fake();
      // Using a beforeEach hook rather than comparing app.vm.$route before and
      // after result.value is set because here, even if a navigation is
      // triggered, it won't be confirmed. That's because it would be a
      // navigation to a duplicate route.
      app.vm.$router.beforeEach(fake);
      result.value = 'a!';
      // If there is a navigation, it will take a moment to complete.
      await wait();
      fake.callCount.should.equal(0);
    });

    it('does not navigate if value of ref changes, but query parameters do not', async () => {
      const app = await load('/?x=a');
      const fromQuery = ({ x }) => x;
      const toQuery = (value) => ({ x: value === 'b' ? 'a' : value });
      const result = withSetup(() => useQueryRef({ fromQuery, toQuery }), {
        container: app.vm.$container
      });
      const fake = sinon.fake();
      app.vm.$router.beforeEach(fake);
      result.value = 'b';
      await wait();
      fake.callCount.should.equal(0);
    });
  });

  describe('avoiding infinite loops', () => {
    it('does not navigate again after change to query parameter changes value of ref', async () => {
      const app = await load('/?x=a');
      withSetup(() => useQueryRef(options.exclamation), {
        container: app.vm.$container
      });
      const fake = sinon.fake();
      app.vm.$router.beforeEach(fake);
      await app.vm.$router.push('/?x=b');
      // If there is a second navigation, it will take a moment to complete.
      await wait();
      fake.callCount.should.equal(1);
    });

    it('does not set value again after change to value of ref changes query parameter', async () => {
      const app = await load('/?x=a');
      const fromQuery = ({ x }) => ({ someProp: x });
      const toQuery = ({ someProp }) => ({ x: someProp });
      const result = withSetup(() => useQueryRef({ fromQuery, toQuery }), {
        container: app.vm.$container
      });
      const newValue = { someProp: 'b' };
      result.value = newValue;
      await wait();
      result.value.should.equal(newValue);
    });
  });
});
