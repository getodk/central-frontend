import usePaginationQueryRef from '../../src/composables/pagination-query-ref';

import { load } from '../util/http';
import { mockLogin } from '../util/session';
import { wait } from '../util/util';
import { withSetup } from '../util/lifecycle';

const pageSizeOptions = [100, 250, 500];

describe('usePaginationQueryRef()', () => {
  beforeEach(mockLogin);

  it('adds page-size query parameter when page size is changed', async () => {
    const app = await load('/');
    const { pageSize } = withSetup(() => usePaginationQueryRef(pageSizeOptions), {
      container: app.vm.$container
    });
    pageSize.value = 500;
    await wait();
    app.vm.$route.query['page-size'].should.equal('500');
  });

  it('adds page-number query parameter when page number is changed', async () => {
    const app = await load('/');
    const { pageNumber } = withSetup(() => usePaginationQueryRef(pageSizeOptions), {
      container: app.vm.$container
    });
    pageNumber.value = 1;
    await wait();
    app.vm.$route.query['page-number'].should.equal('2');
  });

  describe('floors page-size to nearest valid value', () => {
    const cases = [
      /* eslint-disable no-multi-spaces */
      { input: 50, expected: 100 },   // below minimum → minimum
      { input: 100, expected: 100 },  // exact match → same
      { input: 150, expected: 100 },  // between 100 and 250 → 100
      { input: 249, expected: 100 },  // just below 250 → 100
      { input: 250, expected: 250 },  // exact match → same
      { input: 350, expected: 250 },  // between 250 and 500 → 250
      { input: 499, expected: 250 },  // just below 500 → 250
      { input: 500, expected: 500 },  // exact match → same
      { input: 999, expected: 500 },  // above maximum → maximum
      /* eslint-enable no-multi-spaces */
    ];

    cases.forEach(({ input, expected }) => {
      it(`floors page-size=${input} to ${expected}`, async () => {
        const app = await load(`/?page-size=${input}`);
        const { pageSize } = withSetup(() => usePaginationQueryRef(pageSizeOptions), {
          container: app.vm.$container
        });
        pageSize.value.should.equal(expected);
      });
    });
  });

  [1, 0, -5].forEach((input) => {
    it(`selects first page when page-number=${input} in URL`, async () => {
      const app = await load(`/?page-number=${input}`);
      const { pageNumber } = withSetup(() => usePaginationQueryRef(pageSizeOptions), {
        container: app.vm.$container
      });
      pageNumber.value.should.equal(0);
    });
  });

  it('removes page-number query parameter when set to first page', async () => {
    const app = await load('/?page-number=3');
    const { pageNumber } = withSetup(() => usePaginationQueryRef(pageSizeOptions), {
      container: app.vm.$container
    });
    pageNumber.value.should.equal(2);
    pageNumber.value = 0;
    await wait();
    should.not.exist(app.vm.$route.query['page-number']);
  });
});
