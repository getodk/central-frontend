import SubmissionDiffItem from '../../../src/components/submission/diff-item.vue';

import testData from '../../data';

import { mount } from '../../util/lifecycle';

const mountComponent = (entry) => mount(SubmissionDiffItem, {
  propsData: {
    entry,
    projectId: '1',
    xmlFormId: testData.extendedForms.last().xmlFormId,
    instanceId: 'abcd',
    oldVersionId: 'v1',
    newVersionId: 'v2'
  },
  requestData: {
    fields: testData.extendedForms.last()._fields
  }
});

describe('SubmissionDiffItem', () => {
  beforeEach(() => {
    // The only info about a form that is needed to render
    // diffs is knowledge of which fields contain binary data
    testData.extendedForms.createPast(1, {
      xmlFormId: 'a',
      fields: [testData.fields.binary('/birds/bird/photo')]
    });
  });

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

  it('shows field names as tooltips', () => {
    const diff = {
      new: 'b',
      old: 'a',
      path: ['this_is_a_really_long_field_that_wont_fit']
    };
    const component = mountComponent(diff);
    component.get('.field-name').attributes('title').should.equal('this_is_a_really_long_field_that_wont_fit');
  });

  it('shows an old value of added field as "empty"', () => {
    const diff = {
      new: 'Stacy',
      old: null,
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
      old: null,
      path: ['children', 'child', 'toy']
    };
    const component = mountComponent(diff);
    component.get('.full-path').text().should.equal('children › child › toy');
    component.find('.submission-diff-item.outer-item > .field-name').exists().should.be.false();
    component.get('.nested-change-type').text().should.equal('(added)');
    component.get('.nested-change-type').classes('added').should.be.true();
    component.findAll('.submission-diff-item.inner-item').length.should.equal(3);
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
      old: null,
      path: ['children', 'child', 'toy']
    };
    const component = mountComponent(diff);
    component.get('.full-path').text().should.equal('children › child › toy');
    const nestedDiffs = component.findAll('.submission-diff-item.inner-item');
    nestedDiffs.length.should.equal(6);
    nestedDiffs.at(0).find('.full-path').exists().should.be.false();
    nestedDiffs.at(0).get('.field-name').text().should.equal('name');
    nestedDiffs.at(0).get('.data-new').text().should.equal('Really Cool Toy');
    nestedDiffs.at(3).get('.full-path').text().should.equal('manufacturer');
    nestedDiffs.at(3).get('.field-name').text().should.equal('company');
    nestedDiffs.at(3).get('.data-new').text().should.equal('Big Toy Co.');
    nestedDiffs.at(4).get('.full-path').text().should.equal('manufacturer › location');
    nestedDiffs.at(4).get('.field-name').text().should.equal('city');
    nestedDiffs.at(4).get('.data-new').text().should.equal('Cityville');
  });

  it('shows media download links for binary files', () => {
    const diff = {
      new: 'new_file.jpg',
      old: 'old_file.jpg',
      path: ['birds', ['bird', 3], 'photo'] // (binary field with this path defined in beforeEach)
    };
    const component = mountComponent(diff);
    component.get('.data-old').text().should.equal('old_file.jpg');
    component.get('.data-old > a').attributes('href').should.equal('/v1/projects/1/forms/a/submissions/abcd/versions/v1/attachments/old_file.jpg');
    component.get('.data-new').text().should.equal('new_file.jpg');
    component.get('.data-new > a').attributes('href').should.equal('/v1/projects/1/forms/a/submissions/abcd/versions/v2/attachments/new_file.jpg');
  });
});
