import Pagination from '../../src/components/pagination.vue';

import { mergeMountOptions, mount } from '../util/lifecycle';

const defaultProps = {
  count: 100,
  page: 0,
  size: 25,
  sizeOptions: [10, 25, 50, 100]
};

const mountComponent = (options) =>
  mount(Pagination, mergeMountOptions(options, {
    props: defaultProps
  }));

describe('Pagination', () => {
  describe('navigation buttons', () => {
    describe('first page button', () => {
      it('emits update:page with 0 when clicked', async () => {
        const component = mountComponent({ props: { page: 2 } });
        const button = component.findAll('button')[0];
        await button.trigger('click');
        component.emitted('update:page').should.deep.equal([[0]]);
      });

      it('is disabled on the first page', () => {
        const component = mountComponent({ props: { page: 0 } });
        const button = component.findAll('button')[0];
        button.attributes('aria-disabled').should.equal('true');
      });
    });

    describe('previous page button', () => {
      it('emits update:page with page - 1 when clicked', async () => {
        const component = mountComponent({ props: { page: 2 } });
        const button = component.findAll('button')[1];
        await button.trigger('click');
        component.emitted('update:page').should.deep.equal([[1]]);
      });

      it('is disabled on the first page', () => {
        const component = mountComponent({ props: { page: 0 } });
        const button = component.findAll('button')[1];
        button.attributes('aria-disabled').should.equal('true');
      });
    });

    describe('next page button', () => {
      it('emits update:page with page + 1 when clicked', async () => {
        const component = mountComponent({ props: { page: 0 } });
        const button = component.findAll('button')[2];
        await button.trigger('click');
        component.emitted('update:page').should.deep.equal([[1]]);
      });

      it('is disabled on the last page', () => {
        const component = mountComponent({ props: { page: 3, count: 100, size: 25 } });
        const button = component.findAll('button')[2];
        button.attributes('aria-disabled').should.equal('true');
      });
    });

    describe('last page button', () => {
      it('emits update:page with lastPage when clicked', async () => {
        const component = mountComponent({ props: { page: 0, count: 100, size: 25 } });
        const button = component.findAll('button')[3];
        await button.trigger('click');
        component.emitted('update:page').should.deep.equal([[3]]);
      });

      it('is disabled on the last page', () => {
        const component = mountComponent({ props: { page: 3, count: 100, size: 25 } });
        const button = component.findAll('button')[3];
        button.attributes('aria-disabled').should.equal('true');
      });
    });
  });

  describe('page range display', () => {
    const cases = [
      { description: 'shows correct range on first page', props: { page: 0, count: 100, size: 25 }, expected: 'Rows 1–25 of 100' },
      { description: 'shows correct range on middle page', props: { page: 1, count: 100, size: 25 }, expected: 'Rows 26–50 of 100' },
      { description: 'shows correct range on last page', props: { page: 3, count: 100, size: 25 }, expected: 'Rows 76–100 of 100' },
      { description: 'shows correct range when last page is partial', props: { page: 2, count: 73, size: 25 }, expected: 'Rows 51–73 of 73' },
      { description: 'shows singular form for single row', props: { page: 0, count: 1, size: 25 }, expected: 'Row 1 of 1' },
      { description: 'shows zero row message when landed beyond the last page', props: { page: 1, count: 25, size: 25 }, expected: 'Row 0 of 25' },
      { description: 'shows correct count with removed items', props: { page: 0, count: 100, size: 25, removed: 5 }, expected: 'Rows 1–20 of 95' },
      { description: 'shows correct range on non-last page with removed items', props: { page: 1, count: 100, size: 25, removed: 5 }, expected: 'Rows 26–45 of 95' },
      { description: 'shows thousand separator', props: { page: 0, count: 10000, size: 1000, sizeOptions: [1000, 5000] }, expected: 'Rows 1–1,000 of 10,000' },
    ];

    cases.forEach(({ description, props, expected }) => {
      it(description, () => {
        const component = mountComponent({ props });
        const text = component.find('.form-group').text();
        text.should.equal(expected);
      });
    });
  });

  describe('size selector', () => {
    it('shows all size options', () => {
      const component = mountComponent();
      const options = component.findAll('option');
      options.length.should.equal(4);
      options[0].text().should.equal('10');
      options[1].text().should.equal('25');
      options[2].text().should.equal('50');
      options[3].text().should.equal('100');
    });

    it('emits update:size when changed', async () => {
      const component = mountComponent();
      const select = component.find('select');
      await select.setValue('50');
      component.emitted('update:size').should.deep.equal([[50]]);
    });
  });
});
