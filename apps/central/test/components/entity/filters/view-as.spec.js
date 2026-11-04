import EntityFiltersViewAs from '../../../../src/components/entity/filters/view-as.vue';

import useProject from '../../../../src/request-data/project';

import testData from '../../../data';
import { mount } from '../../../util/lifecycle';
import { testRequestData } from '../../../util/request-data';

const createFieldKeys = (count) => new Array(count).fill(undefined)
  .map((_, i) => testData.extendedFieldKeys
    .createPast(1, { displayName: `App User ${i}` })
    .last());

// Creates public links, each with a form assignment, and returns the assignments.
const createPublicLinkAssignments = (count, xmlFormId = 'f') => {
  for (let i = 0; i < count; i += 1) {
    const actor = testData.extendedPublicLinks
      .createPast(1, { displayName: `Public Link ${i}` })
      .last();
    testData.extendedFormSummaryAssignments.createPast(1, {
      actor,
      role: 'pub-link',
      xmlFormId
    });
  }
  return testData.extendedFormSummaryAssignments.sorted();
};

const mountComponent = ({
  fieldKeys = [],
  formSummaryAssignments = [],
  ...options
} = {}) => {
  if (testData.extendedDatasets.size === 0)
    testData.extendedDatasets.createPast(1, { accessFilter: { type: 'ownerOnly' } });
  const dataset = testData.extendedDatasets.last();
  return mount(EntityFiltersViewAs, {
    container: {
      requestData: testRequestData([useProject], {
        fieldKeys, dataset, formSummaryAssignments
      })
    },
    ...options
  });
};

describe('EntityFiltersViewAs', () => {
  it('does not render the select if the dataset has no access filter', () => {
    testData.extendedDatasets.createPast(1, { accessFilter: null });
    const component = mountComponent({ fieldKeys: createFieldKeys(1) });
    component.find('select').exists().should.be.false;
  });

  describe('app users', () => {
    it('renders a single-select input for each app user', async () => {
      const fieldKeys = createFieldKeys(2);
      const component = mountComponent({ fieldKeys, attachTo: document.body });
      await component.get('.dropdown-trigger').trigger('click');
      component.findAll('input[type="radio"]').length.should.equal(2);
    });

    it('emits an app user ID after selection', async () => {
      const [fieldKey1, fieldKey2] = createFieldKeys(2);
      const component = mountComponent({
        fieldKeys: [fieldKey1, fieldKey2],
        props: { modelValue: fieldKey1.id },
        attachTo: document.body
      });
      await component.get('.dropdown-trigger').trigger('click');
      await component.findAll('input[type="radio"]')[1].setValue(true);
      component.emitted('update:modelValue').should.eql([[fieldKey2.id]]);
    });

    it('emits null after Reset to All is clicked', async () => {
      const [fieldKey] = createFieldKeys(1);
      const component = mountComponent({
        fieldKeys: [fieldKey],
        props: { modelValue: fieldKey.id },
        attachTo: document.body
      });
      await component.get('.dropdown-trigger').trigger('click');
      await component.get('.change-all.single button').trigger('click');
      component.emitted('update:modelValue').should.eql([[null]]);
    });

    it('does not emit an event when the dropdown is closed without a change', async () => {
      const [fieldKey] = createFieldKeys(1);
      const component = mountComponent({
        fieldKeys: [fieldKey],
        props: { modelValue: fieldKey.id },
        attachTo: document.body
      });
      await component.get('.dropdown-trigger').trigger('click');
      await component.get('.dropdown-trigger').trigger('click');
      should.not.exist(component.emitted('update:modelValue'));
    });

    it('shows the display name of the selected app user', () => {
      const [fieldKey] = createFieldKeys(1);
      const component = mountComponent({
        fieldKeys: [fieldKey],
        props: { modelValue: fieldKey.id }
      });
      component.get('.display-value').text().should.equal(fieldKey.displayName);
    });
  });

  describe('public links', () => {
    it('renders a single-select input for each public link', async () => {
      testData.extendedDatasets.createPast(1, {
        accessFilter: { type: 'ownerOnly' },
        linkedForms: [{ xmlFormId: 'f', name: 'Form F' }]
      });
      const formSummaryAssignments = createPublicLinkAssignments(2);
      const component = mountComponent({
        formSummaryAssignments,
        attachTo: document.body
      });
      await component.get('.dropdown-trigger').trigger('click');
      component.findAll('input[type="radio"]').length.should.equal(2);
    });

    it('renders public links for multiple linked forms', async () => {
      testData.extendedDatasets.createPast(1, {
        accessFilter: { type: 'ownerOnly' },
        linkedForms: [
          { xmlFormId: 'f1', name: 'Form 1' },
          { xmlFormId: 'f2', name: 'Form 2' }
        ]
      });
      createPublicLinkAssignments(2, 'f1');
      // The helper returns all assignments created so far, including those for f1.
      const formSummaryAssignments = createPublicLinkAssignments(2, 'f2');
      const component = mountComponent({
        formSummaryAssignments,
        attachTo: document.body
      });
      await component.get('.dropdown-trigger').trigger('click');
      component.findAll('input[type="radio"]').length.should.equal(4);
      component.findAll('.option-group').map(heading => heading.text())
        .should.eql(['Public links']);
      component.findAll('.option-subgroup').map(heading => heading.text())
        .should.eql(['Form 1', 'Form 2']);
    });

    it('shows the display name of each public link', async () => {
      testData.extendedDatasets.createPast(1, {
        accessFilter: { type: 'ownerOnly' },
        linkedForms: [{ xmlFormId: 'f', name: 'Form F' }]
      });
      const formSummaryAssignments = createPublicLinkAssignments(2);
      const component = mountComponent({
        formSummaryAssignments,
        attachTo: document.body
      });
      await component.get('.dropdown-trigger').trigger('click');
      component.text().should.contain('Public Link 0');
      component.text().should.contain('Public Link 1');
    });

    it('does not render public links if the linked forms have no assignments', async () => {
      testData.extendedDatasets.createPast(1, {
        accessFilter: { type: 'ownerOnly' },
        linkedForms: [{ xmlFormId: 'f', name: 'Form F' }]
      });
      const component = mountComponent({
        formSummaryAssignments: [],
        attachTo: document.body
      });
      await component.get('.dropdown-trigger').trigger('click');
      component.findAll('input[type="radio"]').length.should.equal(0);
    });

    it('skips a public link whose form is not in the dataset linked forms', async () => {
      testData.extendedDatasets.createPast(1, {
        accessFilter: { type: 'ownerOnly' },
        linkedForms: [{ xmlFormId: 'f1', name: 'Form 1' }]
      });
      createPublicLinkAssignments(1, 'f1');
      // The helper returns all assignments created so far, including the one for f1.
      const formSummaryAssignments = createPublicLinkAssignments(1, 'f2');
      const component = mountComponent({
        formSummaryAssignments,
        attachTo: document.body
      });
      await component.get('.dropdown-trigger').trigger('click');
      component.findAll('input[type="radio"]').length.should.equal(1);
      component.text().should.contain('Public Link 0');
      component.text().should.not.contain('Public Link 1'); // f2 assignment, which is not a linked form
    });

    it('emits a public link ID after selection', async () => {
      testData.extendedDatasets.createPast(1, {
        accessFilter: { type: 'ownerOnly' },
        linkedForms: [{ xmlFormId: 'f', name: 'Form F' }]
      });
      const [assignment] = createPublicLinkAssignments(2);
      const component = mountComponent({
        formSummaryAssignments: [assignment],
        attachTo: document.body
      });
      await component.get('.dropdown-trigger').trigger('click');
      await component.findAll('input[type="radio"]')[0].setValue(true);
      component.emitted('update:modelValue').should.eql([[assignment.actor.id]]);
    });

    it('emits null after Reset to All is clicked', async () => {
      testData.extendedDatasets.createPast(1, {
        accessFilter: { type: 'ownerOnly' },
        linkedForms: [{ xmlFormId: 'f', name: 'Form F' }]
      });
      const [assignment] = createPublicLinkAssignments(1);
      const component = mountComponent({
        formSummaryAssignments: [assignment],
        props: { modelValue: assignment.actor.id },
        attachTo: document.body
      });
      await component.get('.dropdown-trigger').trigger('click');
      await component.get('.change-all.single button').trigger('click');
      component.emitted('update:modelValue').should.eql([[null]]);
    });
  });

  describe('app users and public links', () => {
    it('renders app users and public links in the same list', async () => {
      testData.extendedDatasets.createPast(1, {
        accessFilter: { type: 'ownerOnly' },
        linkedForms: [{ xmlFormId: 'f', name: 'Form F' }]
      });
      const fieldKeys = createFieldKeys(2);
      const formSummaryAssignments = createPublicLinkAssignments(2);
      const component = mountComponent({
        fieldKeys,
        formSummaryAssignments,
        attachTo: document.body
      });
      await component.get('.dropdown-trigger').trigger('click');
      const texts = component.findAll('.single-select-option')
        .map(row => row.text());
      texts.should.eql(['App User 0', 'App User 1', 'Public Link 0', 'Public Link 1']);
    });

    it('shows group headings for app users and public links by form', async () => {
      testData.extendedDatasets.createPast(1, {
        accessFilter: { type: 'ownerOnly' },
        linkedForms: [
          { xmlFormId: 'f1', name: 'Form 1' },
          { xmlFormId: 'f2', name: 'Form 2' }
        ]
      });
      const fieldKeys = createFieldKeys(2);
      createPublicLinkAssignments(2, 'f1');
      const formSummaryAssignments = createPublicLinkAssignments(2, 'f2');
      const component = mountComponent({
        fieldKeys,
        formSummaryAssignments,
        attachTo: document.body
      });
      await component.get('.dropdown-trigger').trigger('click');
      const headings = component.findAll('.option-group').map(heading => heading.text());
      headings.should.eql(['App users', 'Public links']);
      const subheadings = component.findAll('.option-subgroup')
        .map(heading => heading.text());
      subheadings.should.eql(['Form 1', 'Form 2']);
      component.findAll('input[type="radio"]').length.should.equal(6);
      const texts = component.findAll('.single-select-option')
        .map(row => row.text());
      texts.should.eql([
        'App User 0',
        'App User 1',
        'Public Link 0',
        'Public Link 1',
        'Public Link 0',
        'Public Link 1'
      ]);
    });
  });

  describe('display value', () => {
    it('shows default label if modelValue is null', () => {
      const [fieldKey] = createFieldKeys(1);
      const component = mountComponent({
        fieldKeys: [fieldKey],
        props: { modelValue: null }
      });
      component.get('.display-value').text().should.equal('All');
    });

    it('shows default label if the actor id is not in the field keys list', () => {
      const [fieldKey] = createFieldKeys(1);
      const component = mountComponent({
        props: { modelValue: fieldKey.id }
      });
      component.get('.display-value').text().should.equal('All');
    });

    it('shows default label if actor id is not in the linked form assignments', () => {
      testData.extendedDatasets.createPast(1, {
        accessFilter: { type: 'ownerOnly' },
        linkedForms: [{ xmlFormId: 'f1', name: 'Form 1' }]
      });
      const [assignment] = createPublicLinkAssignments(1, 'f2');
      const component = mountComponent({
        formSummaryAssignments: [assignment],
        props: { modelValue: assignment.actor.id }
      });
      component.get('.display-value').text().should.equal('All');
    });

    it('shows default label if there are no assignments', () => {
      testData.extendedDatasets.createPast(1, {
        accessFilter: { type: 'ownerOnly' },
        linkedForms: [{ xmlFormId: 'f', name: 'Form F' }]
      });
      const [assignment] = createPublicLinkAssignments(1);
      const component = mountComponent({
        props: { modelValue: assignment.actor.id }
      });
      component.get('.display-value').text().should.equal('All');
    });
  });
});
