import EntityDiffHead from '../../../../src/components/entity/diff/head.vue';

import testData from '../../../data';
import { mount } from '../../../util/lifecycle';

const mountComponent = () => mount(EntityDiffHead, {
  props: { modelValue: 'baseDiff' },
  global: {
    provide: { entityVersion: testData.extendedEntityVersions.last() }
  }
});

describe('EntityDiffHead', () => {
  describe('hard conflict', () => {
    beforeEach(() => {
      testData.extendedEntities.createPast(1, { label: 'foo' });
      testData.extendedEntityVersions.createPast(1, { label: 'bar' });
      testData.extendedEntityVersions.createPast(1, {
        baseVersion: 1,
        label: 'baz',
        conflictingProperties: ['label']
      });
    });

    it('shows the correct icon', () => {
      mountComponent().find('.icon-warning').exists().should.be.true;
    });

    it('shows the correct text', () => {
      const text = mountComponent().get('p').text();
      text.should.equal('Conflict\u00a0This Submission update was applied to version 2 of this Entity, but it was created based on version 1. Other updates had already written to the same properties.');
    });
  });

  describe('soft conflict', () => {
    beforeEach(() => {
      testData.extendedEntities.createPast(1);
      testData.extendedEntityVersions.createPast(2, { baseVersion: 1 });
    });

    it('shows the correct icon', () => {
      mountComponent().find('.icon-info-circle').exists().should.be.true;
    });

    it('shows the correct text', () => {
      const text = mountComponent().get('p').text();
      text.should.equal('Parallel Update\u00a0This Submission update was applied to version 2 of this Entity, but it was created based on version 1.');
    });
  });

  it('shows the correct versions in the tabs', () => {
    testData.extendedEntities.createPast(1);
    testData.extendedEntityVersions.createPast(2, { baseVersion: 1 });
    const text = mountComponent().findAll('li a').map(a => a.text());
    text.should.eql([
      'Author’s View (updating v1)',
      'Central’s View (updating v2)'
    ]);
  });

  it('activates the tab that corresponds to the modelValue prop', () => {
    testData.extendedEntities.createPast(1);
    testData.extendedEntityVersions.createPast(2, { baseVersion: 1 });
    const li = mountComponent().findAll('li.active');
    li.length.should.equal(1);
    li[0].text().should.startWith('Author');
  });

  it('emits an update:modelValue event after a click on a tab', async () => {
    testData.extendedEntities.createPast(1);
    testData.extendedEntityVersions.createPast(2, { baseVersion: 1 });
    const component = mountComponent();
    await component.get('li:nth-child(2) a').trigger('click');
    component.emitted('update:modelValue').should.eql([['serverDiff']]);
  });
});
