import EntityCreate from '../../../src/components/entity/create.vue';
import EntityUpdateRow from '../../../src/components/entity/update/row.vue';

import testData from '../../data';
import { mergeMountOptions, mount } from '../../util/lifecycle';
import { mockHttp } from '../../util/http';

const mountOptions = (options = undefined) => mergeMountOptions(options, {
  props: { state: true },
  container: {
    requestData: { dataset: testData.extendedDatasets.last() }
  }
});
const mountComponent = (options = undefined) =>
  mount(EntityCreate, mountOptions(options));

describe('EntityCreate', () => {
  it('shows the correct title', () => {
    testData.extendedDatasets.createPast(1);
    const text = mountComponent().get('.modal-title').text();
    text.should.equal('Create New Entity');
  });

  describe('input of entity label', () => {
    it('renders a row for the label', () => {
      testData.extendedDatasets.createPast(1);
      const row = mountComponent().getComponent(EntityUpdateRow);
      row.props().required.should.equal(true);
      should.not.exist(row.props().label);
      should.not.exist(row.props().modelValue);
    });
  });

  describe('input of entity data', () => {
    beforeEach(() => {
      testData.extendedDatasets.createPast(1, {
        properties: [{ name: 'height' }, { name: 'circumference' }]
      });
    });

    it('renders a row for each dataset property', () => {
      const rows = mountComponent().findAllComponents(EntityUpdateRow);
      rows.length.should.equal(3);
    });

    it('passes the correct props to the row', () => {
      const row = mountComponent().findAllComponents(EntityUpdateRow)[1];
      row.props().label.should.equal('height');
      should.not.exist(row.props().modelValue);
    });
  });

  it('focuses the entity label textarea', () => {
    testData.extendedDatasets.createPast(1);
    const modal = mountComponent({ attachTo: document.body });
    modal.get('textarea').should.be.focused();
  });

  it('resizes the textarea elements', async () => {
    testData.extendedDatasets.createPast(1, {
      properties: [{ name: 'height' }],
    });
    const modal = mountComponent({
      props: { state: false },
      attachTo: document.body
    });
    const textareas = modal.findAll('textarea');
    textareas.map(({ element }) => element.style.height).should.eql(['', '']);
    await modal.setProps({ state: true });
    await modal.vm.$nextTick();
    const heights = textareas.map(({ element }) => element.style.height);
    heights[0].should.not.equal('');
    heights[1].should.not.equal('');
  });

  it('resets the form after the modal is hidden', async () => {
    testData.extendedDatasets.createPast(1, {
      properties: [{ name: 'height' }]
    });
    const modal = mountComponent();
    const rows = modal.findAllComponents(EntityUpdateRow);
    await rows[0].get('textarea').setValue('New Label');
    await rows[1].get('textarea').setValue('2');
    await modal.setProps({ state: false });
    await modal.setProps({ state: true });
    should.not.exist(rows[0].props().modelValue);
    should.not.exist(rows[1].props().modelValue);
  });

  it('sends the correct request', () => {
    testData.extendedDatasets.createPast(1, {
      name: 'á',
      properties: [{ name: 'height' }]
    });
    return mockHttp()
      .mount(EntityCreate, mountOptions())
      .request(async (modal) => {
        const textareas = modal.findAll('textarea');
        await textareas[0].setValue('New Label');
        await textareas[1].setValue('2');
        return modal.get('form').trigger('submit');
      })
      .respondWithProblem()
      .testRequests([{
        method: 'POST',
        url: '/v1/projects/1/datasets/%C3%A1/entities',
        data: {
          label: 'New Label',
          data: Object.assign(Object.create(null), { height: '2' })
        },
      }]);
  });

  it('does not send empty values', () => {
    testData.extendedDatasets.createPast(1, {
      properties: [{ name: 'height' }],
      entities: 0
    });
    return mockHttp()
      .mount(EntityCreate, mountOptions())
      .request(async (modal) => {
        await modal.findAll('textarea')[0].setValue('New Label');
        return modal.get('form').trigger('submit');
      })
      .beforeEachResponse((_, { data }) => {
        data.should.eql({
          label: 'New Label',
          data: Object.create(null)
        });
      })
      .respondWithProblem();
  });

  it('implements some standard button things', () => {
    testData.extendedDatasets.createPast(1, {
      properties: [{ name: 'height' }],
      entities: 0
    });
    return mockHttp()
      .mount(EntityCreate, mountOptions())
      .testStandardButton({
        button: 'button[type="submit"]',
        request: async (modal) => {
          await modal.findAll('textarea')[0].setValue('New Label');
          return modal.get('form').trigger('submit');
        },
        disabled: ['.btn-link'],
        modal: true
      });
  });

  it('emits a success event after a successful response', () => {
    testData.extendedDatasets.createPast(1, {
      properties: [{ name: 'height' }],
      entities: 0
    });
    return mockHttp()
      .mount(EntityCreate, mountOptions())
      .request(async (modal) => {
        const textareas = modal.findAll('textarea');
        await textareas[0].setValue('New Label');
        await textareas[1].setValue('2');
        return modal.get('form').trigger('submit');
      })
      .respondWithData(() => {
        testData.extendedEntities.createNew({
          label: 'New Label',
          data: { height: '2' }
        });
        return testData.standardEntities.last();
      })
      .afterResponse(modal => {
        const created = testData.standardEntities.last();
        modal.emitted('success').should.eql([[created]]);
      });
  });
});
