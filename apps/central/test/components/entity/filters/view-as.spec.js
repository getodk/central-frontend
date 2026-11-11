import EntityFiltersViewAs from '../../../../src/components/entity/filters/view-as.vue';
import Multiselect from '../../../../src/components/multiselect.vue';

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

    it('emits an app user ID after selection is applied', async () => {
      const [fieldKey1, fieldKey2] = createFieldKeys(2);
      const component = mountComponent({
        fieldKeys: [fieldKey1, fieldKey2],
        props: { modelValue: fieldKey1.id },
        attachTo: document.body
      });
      await component.get('.dropdown-trigger').trigger('click');
      await component.findAll('input[type="radio"]')[1].setValue(true);
      await component.get('.action-bar button').trigger('click');
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
      await component.get('.action-bar button').trigger('click');
      component.emitted('update:modelValue').should.eql([[null]]);
    });

    it('does not emit an event when Apply is clicked without a change', async () => {
      const [fieldKey] = createFieldKeys(1);
      const component = mountComponent({
        fieldKeys: [fieldKey],
        props: { modelValue: fieldKey.id },
        attachTo: document.body
      });
      await component.get('.dropdown-trigger').trigger('click');
      await component.get('.action-bar button').trigger('click');
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
      const component = mountComponent({ formSummaryAssignments });
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
      const component = mountComponent({ formSummaryAssignments });
      await component.get('.dropdown-trigger').trigger('click');
      component.findAll('input[type="radio"]').length.should.equal(4);
    });

    it('public links groups (forms) and text (display names) are in alphabetical order', async () => {
      testData.extendedDatasets.createPast(1, {
        accessFilter: { type: 'ownerOnly' },
        linkedForms: [
          { xmlFormId: 'f1', name: 'Form Z' },
          { xmlFormId: 'f2', name: 'Form A' }
        ]
      });
      createPublicLinkAssignments(2, 'f1');
      const assignments = createPublicLinkAssignments(2, 'f2');
      const formZ = assignments.filter(({ xmlFormId }) => xmlFormId === 'f1');
      const formA = assignments.filter(({ xmlFormId }) => xmlFormId === 'f2');
      formZ[0].actor.displayName = 'Z link B';
      formZ[1].actor.displayName = 'Z link A';
      formA[0].actor.displayName = 'A link B';
      formA[1].actor.displayName = 'A link A';
      const fieldKeys = createFieldKeys(1);
      const component = mountComponent({
        fieldKeys,
        formSummaryAssignments: [formZ[0], formA[0], formZ[1], formA[1]]
      });

      const { options } = component.getComponent(Multiselect).props();
      options.map(({ text }) => text).should.eql([
        'App User 0',
        'A link A',
        'A link B',
        'Z link A',
        'Z link B'
      ]);
      await component.get('.dropdown-trigger').trigger('click');
      component.findAll('.option-group').map(heading => heading.text()).should.eql([
        'App Users',
        'Public Links: Form A',
        'Public Links: Form Z'
      ]);
    });

    it('shows the display name of each public link', async () => {
      testData.extendedDatasets.createPast(1, {
        accessFilter: { type: 'ownerOnly' },
        linkedForms: [{ xmlFormId: 'f', name: 'Form F' }]
      });
      const formSummaryAssignments = createPublicLinkAssignments(2);
      const component = mountComponent({ formSummaryAssignments });
      await component.get('.dropdown-trigger').trigger('click');
      component.text().should.contain('Public Link 0');
      component.text().should.contain('Public Link 1');
    });

    it('does not render public links if the linked forms have no assignments', async () => {
      testData.extendedDatasets.createPast(1, {
        accessFilter: { type: 'ownerOnly' },
        linkedForms: [{ xmlFormId: 'f', name: 'Form F' }]
      });
      const component = mountComponent({ formSummaryAssignments: [] });
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
      const component = mountComponent({ formSummaryAssignments });
      await component.get('.dropdown-trigger').trigger('click');
      component.findAll('input[type="radio"]').length.should.equal(1);
      component.text().should.contain('Public Link 0');
      component.text().should.not.contain('Public Link 1'); // f2 assignment, which is not a linked form
    });

    it('emits a public link ID after selection is applied', async () => {
      testData.extendedDatasets.createPast(1, {
        accessFilter: { type: 'ownerOnly' },
        linkedForms: [{ xmlFormId: 'f', name: 'Form F' }]
      });
      const [assignment] = createPublicLinkAssignments(1);
      const component = mountComponent({
        formSummaryAssignments: [assignment]
      });
      await component.get('.dropdown-trigger').trigger('click');
      await component.findAll('input[type="radio"]')[0].setValue(true);
      await component.get('.action-bar button').trigger('click');
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
        props: { modelValue: assignment.actor.id }
      });
      await component.get('.dropdown-trigger').trigger('click');
      await component.get('.change-all.single button').trigger('click');
      await component.get('.action-bar button').trigger('click');
      component.emitted('update:modelValue').should.eql([[null]]);
    });
  });

  describe('app users and public links', () => {
    it('includes app users and public links in the options', () => {
      testData.extendedDatasets.createPast(1, {
        accessFilter: { type: 'ownerOnly' },
        linkedForms: [{ xmlFormId: 'f', name: 'Form F' }]
      });
      const fieldKeys = createFieldKeys(2);
      const formSummaryAssignments = createPublicLinkAssignments(2);
      const component = mountComponent({
        fieldKeys,
        formSummaryAssignments
      });
      const texts = component.getComponent(Multiselect).props().options
        .map(({ text }) => text);
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
      headings.should.eql([
        'App Users',
        'Public Links: Form 1',
        'Public Links: Form 2'
      ]);
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
