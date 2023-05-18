import DiffItem from '../../src/components/diff-item.vue';

import { mount } from '../util/lifecycle';

const mountComponent = (props) => mount(DiffItem, { props });

describe('DiffItem', () => {
  it('shows the diff a simple change to one field', () => {
    const diff = {
      new: '17',
      old: '15',
      path: ['age']
    };
    const component = mountComponent(diff);
    component.find('.full-path').exists().should.be.false();
    component.get('.field-name').text().should.equal('age');
    component.get('.data-old').text().should.equal('15');
    component.get('.icon-arrow-circle-right').exists().should.be.true();
    component.get('.data-new').text().should.equal('17');
  });

  it('shows longer path for change in a group or repeat', () => {
    const diff = {
      new: '48',
      old: '45',
      path: ['family', 'primary_contact', 'person', 'age']
    };
    const component = mountComponent(diff);
    component.findAll('.full-path > span').length.should.equal(3);
    component.get('.full-path').text().should.equal('family › primary_contact › person');
    component.get('.field-name').text().should.equal('age');
  });

  it('shows counts (e.g. element #2) for paths representing repeats', () => {
    const diff = {
      new: 'Fluffy',
      old: 'Snuffy',
      path: ['family', 'children', ['child', 2], 'toys', ['toy', 0], 'name']
    };
    const component = mountComponent(diff);
    component.get('.full-path').text().should.equal('family › children › child #3 › toys › toy #1');
    component.findAll('.full-path > span').length.should.equal(5);
    component.get('.field-name').text().should.equal('name');
  });

  it('shows field names as tooltips', async () => {
    const diff = {
      new: 'b',
      old: 'a',
      path: ['this_is_a_really_long_field_that_wont_fit']
    };
    const component = mountComponent(diff);
    await component.get('.field-name').should.have.textTooltip();
  });

  it('shows an old value of added field as "empty"', () => {
    const diff = {
      new: 'Stacy',
      path: ['name']
    };
    const component = mountComponent(diff);
    component.find('.data-old').exists().should.be.false();
    component.get('.data-empty').text().should.equal('empty');
    component.get('.data-new').text().should.equal('Stacy');
  });

  it('shows the full path of an instance addition and word "added"', () => {
    const diff = {
      new: {
        name: 'Really Cool Toy',
        brand: 'Toy Co. Inc.',
        price: '9.99'
      },
      path: ['children', 'child', 'toy']
    };
    const component = mountComponent(diff);
    component.get('.full-path').text().should.equal('children › child › toy');
    component.find('.diff-item.outer-item > .field-name').exists().should.be.false();
    component.get('.nested-change-type').text().should.equal('(added)');
    component.get('.nested-change-type').classes('added').should.be.true();
    const nestedDiffs = component.findAll('.diff-item.inner-item');
    nestedDiffs.length.should.equal(3);
    nestedDiffs[0].find('.data-old').exists().should.be.false();
    nestedDiffs[0].get('.data-new').text().should.equal('Really Cool Toy');
  });

  it('shows the full path of an instance deletion and word "deleted"', () => {
    const diff = {
      old: {
        name: 'Really Cool Toy',
        brand: 'Toy Co. Inc.',
        price: '9.99'
      },
      path: ['children', 'child', 'toy']
    };
    const component = mountComponent(diff);
    component.get('.full-path').text().should.equal('children › child › toy');
    component.find('.diff-item.outer-item > .field-name').exists().should.be.false();
    component.get('.nested-change-type').text().should.equal('(deleted)');
    component.get('.nested-change-type').classes('deleted').should.be.true();
    const nestedDiffs = component.findAll('.diff-item.inner-item');
    nestedDiffs.length.should.equal(3);
    nestedDiffs[0].get('.data-old').text().should.equal('Really Cool Toy');
    nestedDiffs[0].find('.data-new').exists().should.be.false();
  });

  it('shows nested instance diffs correctly', () => {
    const diff = {
      new: {
        name: 'Really Cool Toy',
        brand: 'Toy Co. Inc.',
        price: '9.99',
        manufacturer: {
          company: 'Big Toy Co.',
          location: {
            city: 'Cityville',
            state: 'State of Mind'
          }
        }
      },
      path: ['children', 'child', 'toy']
    };
    const component = mountComponent(diff);
    component.get('.full-path').text().should.equal('children › child › toy');
    const nestedDiffs = component.findAll('.diff-item.inner-item');
    nestedDiffs.length.should.equal(6);
    nestedDiffs[0].find('.full-path').exists().should.be.false();
    nestedDiffs[0].get('.field-name').text().should.equal('name');
    nestedDiffs[0].get('.data-new').text().should.equal('Really Cool Toy');
    nestedDiffs[3].get('.full-path').text().should.equal('manufacturer');
    nestedDiffs[3].get('.field-name').text().should.equal('company');
    nestedDiffs[3].get('.data-new').text().should.equal('Big Toy Co.');
    nestedDiffs[4].get('.full-path').text().should.equal('manufacturer › location');
    nestedDiffs[4].get('.field-name').text().should.equal('city');
    nestedDiffs[4].get('.data-new').text().should.equal('Cityville');
  });

  it('shows nested repeat groups correctly flattened', () => {
    const diff = {
      old: {
        first_name: 'Windy',
        last_name: 'Pine',
        toys: {
          toy: [
            {
              name: 'Doll',
              price: '12'
            },
            {
              name: 'Truck',
              price: '15'
            }
          ]
        }
      },
      path: ['children', ['child', 1]]
    };
    const component = mountComponent(diff);
    component.get('.full-path').text().should.equal('children › child #2');
    const nestedDiffs = component.findAll('.diff-item.inner-item');
    nestedDiffs.length.should.equal(6);
    nestedDiffs[0].find('.full-path').exists().should.be.false();
    nestedDiffs[0].get('.field-name').text().should.equal('first_name');
    nestedDiffs[0].get('.data-old').text().should.equal('Windy');
    nestedDiffs[5].get('.full-path').text().should.equal('toys › toy #2');
    nestedDiffs[5].get('.field-name').text().should.equal('price');
    nestedDiffs[5].get('.data-old').text().should.equal('15');
  });

  it('handles when a repeat group goes between 0 and N elements', () => {
    // When items in a repeat group get added to an empty set, or all elements
    // get deleted to create an empty set, the backend diff algorithm
    // returns an array of objects instead of an object for the old or new value.
    // The `flattenDiff` algorithm in `diff-item` winds up splitting the name of
    // the repeat group (`toy`) and the index/counter (`#1`) when computing the
    // full path and field name (vs. keeping `toy #1` together).
    // This might not be the best solution overall, but it is fairly sensible.
    // --------------------------------
    // toys > toy
    // (added)  #1
    //          name   empty -> "Truck"
    // --------------------------------
    const diff = {
      new: [
        {
          name: 'Tonka Truck'
        }
      ],
      path: ['child', 'toys', 'toy']
    };
    const component = mountComponent(diff);
    component.get('.full-path').text().should.equal('child › toys › toy');
    const nestedDiffs = component.findAll('.diff-item.inner-item');
    nestedDiffs.length.should.equal(1);
    nestedDiffs[0].get('.full-path').text().should.equal('#1');
    nestedDiffs[0].get('.field-name').text().should.equal('name');
    nestedDiffs[0].get('.data-new').text().should.equal('Tonka Truck');
  });

  it('shows empty -> empty when instance added/deleted with empty string', () => {
    // It's possible for a nested instance addition/deletion to contain an empty
    // string, e.g. an instance added to a repeat group without all the info filled in.
    // When this gets flattened for the nested display, one side of the change will be null
    // and the other half will be "". This will look in the UI like empty -> empty.
    const diff = {
      new: {
        name: ''
      },
      path: ['child', 'toys', ['toy', 2]]
    };
    const component = mountComponent(diff);
    component.get('.full-path').text().should.equal('child › toys › toy #3');
    const nestedDiffs = component.findAll('.diff-item.inner-item');
    nestedDiffs.length.should.equal(1);
    nestedDiffs[0].get('.field-name').text().should.equal('name');
    nestedDiffs[0].findAll('.data-empty').length.should.equal(2);
    nestedDiffs[0].find('.data-old').exists().should.be.false();
    nestedDiffs[0].find('.data-new').exists().should.be.false();
  });

  describe('slot', () => {
    it('uses the default slot', () => {
      const component = mount({
        template: `<diff-item v-slot="slotProps" :path="['p']" old="x" new="y">
          {{ slotProps.path.join('.') }}: {{ slotProps.value }} ({{ slotProps.isOld ? 'old' : 'new' }})
        </diff-item>`,
        components: { DiffItem }
      });
      component.get('.data-old').text().should.equal('p: x (old)');
      component.get('.data-new').text().should.equal('p: y (new)');
    });

    it('it uses the default slot for nested items', () => {
      const diff = {
        new: {
          name: 'Really Cool Toy',
          brand: 'Toy Co. Inc.',
          price: '9.99'
        },
        path: ['children', 'child', 'toy']
      };
      const component = mount({
        template: `<diff-item v-slot="slotProps" v-bind="diff">
          {{ slotProps.parentPath.join('.') }}/{{ slotProps.path.join('.') }}: {{ slotProps.value }} ({{ slotProps.isOld ? 'old' : 'new' }})
        </diff-item>`,
        components: { DiffItem },
        setup() {
          return { diff };
        }
      });
      const nestedDiffs = component.findAll('.diff-item.inner-item');
      nestedDiffs.length.should.equal(3);
      nestedDiffs[0].find('.data-old').exists().should.be.false();
      const text = nestedDiffs[0].get('.data-new').text();
      text.should.equal('children.child.toy/name: Really Cool Toy (new)');
    });
  });
});
