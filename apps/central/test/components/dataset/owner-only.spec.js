import DatasetOwnerOnly from '../../../src/components/dataset/owner-only.vue';
import Modal from '../../../src/components/modal.vue';

import testData from '../../data';
import { load, mockHttp } from '../../util/http';
import { mockLogin } from '../../util/session';
import { mount } from '../../util/lifecycle';
import { testRequestData } from '../../util/request-data';

const mountOptions = () => ({
  container: {
    requestData: testRequestData(['actorProperties'], {
      dataset: testData.extendedDatasets.last(),
      actorProperties: testData.actorProperties.sorted()
    })
  }
});

const mountComponent = () => mount(DatasetOwnerOnly, mountOptions());

describe('DatasetOwnerOnly', () => {
  describe('modal text', () => {
    it('shows the correct modal after "Access all" is selected', async () => {
      testData.extendedDatasets.createPast(1, { accessFilter: { type: 'ownerOnly' } });
      const component = mountComponent();
      await component.get('input[value="all"]').setChecked();
      component.getComponent(Modal).props().state.should.be.true;
      component.get('.modal-title').text().should.equal('Access all Entities');
      const introduction = component.get('.modal-introduction').text();
      introduction.should.startWith('App Users and Data Collectors will have access to all Entities,');
      const buttonText = component.get('.modal-actions .btn-primary').text();
      buttonText.should.equal('Access all Entities');
    });

    it('shows the correct modal after "Only access own" is selected', async () => {
      testData.extendedDatasets.createPast(1, { accessFilter: null });
      const component = mountComponent();
      await component.get('input[value="ownerOnly"]').setChecked();
      component.getComponent(Modal).props().state.should.be.true;
      const title = component.get('.modal-title').text();
      title.should.equal('Only access own Entities');
      const introduction = component.get('.modal-introduction').text();
      introduction.should.startWith('App Users and Data Collectors will lose access to the Entities they have not created.');
      const buttonText = component.get('.modal-actions .btn-primary').text();
      buttonText.should.equal('Access own Entities');
    });

    it('shows the correct modal after "Filter by Property" is selected', async () => {
      testData.actorProperties.createPast(1, { name: 'region' });
      testData.extendedDatasets.createPast(1, {
        accessFilter: null,
        properties: [{ name: 'city' }]
      });
      const component = mountComponent();
      await component.get('input[value="property"]').setChecked();
      component.getComponent(Modal).props().state.should.be.true;
      const title = component.get('.modal-title').text();
      title.should.equal('Filter by Property');
      const introduction = component.get('.modal-introduction').text();
      introduction.should.include('will only have access to Entities where the selected property matches');
      const buttonText = component.get('.modal-actions .btn-primary').text();
      buttonText.should.equal('Save Filter Rule');
    });
  });

  describe('canceling', () => {
    for (const selector of ['.close', '.btn-link']) {
      it(`it cancels after ${selector} is clicked`, async () => {
        testData.extendedDatasets.createPast(1, { accessFilter: { type: 'ownerOnly' } });
        const component = mountComponent();
        const inputs = component.findAll('input[type="radio"]');
        const checked = () => inputs.map(input => input.element.checked);

        // Initial state
        component.getComponent(Modal).props().state.should.be.false;
        checked().should.eql([false, true, false]);

        // Changing the selection
        await inputs[0].setChecked();
        component.getComponent(Modal).props().state.should.be.true;
        checked().should.eql([true, false, false]);

        // Canceling
        await component.getComponent(Modal).get(selector).trigger('click');
        component.getComponent(Modal).props().state.should.be.false;
        checked().should.eql([false, true, false]);
      });
    }
  });

  describe('sends the correct request', () => {
    it('sends correct request when changing to "Access all"', () => {
      testData.extendedDatasets.createPast(1, { accessFilter: { type: 'ownerOnly' } });
      return mockHttp()
        .mount(DatasetOwnerOnly, mountOptions())
        .complete()
        .request(async (component) => {
          await component.get('input[value="all"]').setChecked();
          await component.get('.modal-actions .btn-primary').trigger('click');
        })
        .respondWithProblem()
        .testRequests([{
          method: 'PATCH',
          url: '/v1/projects/1/datasets/trees',
          data: { accessFilter: null }
        }]);
    });

    it('sends correct request when changing to "Only access own"', () => {
      testData.extendedDatasets.createPast(1, { accessFilter: null });
      return mockHttp()
        .mount(DatasetOwnerOnly, mountOptions())
        .complete()
        .request(async (component) => {
          await component.get('input[value="ownerOnly"]').setChecked();
          await component.get('.modal-actions .btn-primary').trigger('click');
        })
        .respondWithProblem()
        .testRequests([{
          method: 'PATCH',
          url: '/v1/projects/1/datasets/trees',
          data: { accessFilter: { type: 'ownerOnly' } }
        }]);
    });

    it('sends correct request when changing to "Filter by Property"', () => {
      testData.actorProperties.createPast(1, { name: 'region' });
      testData.extendedDatasets.createPast(1, {
        accessFilter: null,
        properties: [{ name: 'city' }]
      });
      return mockHttp()
        .mount(DatasetOwnerOnly, mountOptions())
        .complete()
        .request(async (component) => {
          await component.get('input[value="property"]').setChecked();
          await component.get('select').findAll('option')[1].setSelected();
          await component.findAll('select')[1].findAll('option')[1].setSelected();
          await component.get('#property-filter-form').trigger('submit');
        })
        .respondWithProblem()
        .testRequests([{
          method: 'PATCH',
          url: '/v1/projects/1/datasets/trees',
          data: {
            accessFilter: {
              type: 'property',
              rules: [{ datasetProperty: 'city', actorProperty: 'region' }]
            }
          }
        }]);
    });
  });

  it('implements some standard button things', () => {
    testData.extendedDatasets.createPast(1, { accessFilter: { type: 'ownerOnly' } });
    return mockHttp()
      .mount(DatasetOwnerOnly, mountOptions())
      .afterResponses(component => component.get('input[value="all"]').setChecked())
      .testStandardButton({
        button: '.modal-actions .btn-primary',
        disabled: ['.modal-actions .btn-link'],
        modal: Modal
      });
  });

  describe('alert', () => {
    it('shows the correct text once accessFilter has been changed to null', () => {
      testData.actorProperties.createPast(1, { name: 'region' });
      testData.extendedDatasets.createPast(1, {
        accessFilter: { type: 'ownerOnly' },
        properties: [{ name: 'city' }]
      });
      return mockHttp()
        .mount(DatasetOwnerOnly, mountOptions())
        .complete()
        .request(async (component) => {
          await component.get('input[value="all"]').setChecked();
          await component.get('.modal-actions .btn-primary').trigger('click');
        })
        .respondWithData(() =>
          testData.extendedDatasets.update(-1, { accessFilter: null }))
        .afterResponse(component => {
          component.should.alert('success', (message) => {
            message.should.endWith('will now have access to all Entities.');
          });
        });
    });

    it('shows the correct text once accessFilter has been changed to ownerOnly', () => {
      testData.extendedDatasets.createPast(1, { accessFilter: null });
      return mockHttp()
        .mount(DatasetOwnerOnly, mountOptions())
        .complete()
        .request(async (component) => {
          await component.get('input[value="ownerOnly"]').setChecked();
          await component.get('.modal-actions .btn-primary').trigger('click');
        })
        .respondWithData(() =>
          testData.extendedDatasets.update(-1, { accessFilter: { type: 'ownerOnly' } }))
        .afterResponse(component => {
          component.should.alert('success', (message) => {
            message.should.endWith('will now only have access to Entities they create.');
          });
        });
    });

    it('shows the correct text once accessFilter has been changed to property', () => {
      testData.actorProperties.createPast(1, { name: 'region' });
      testData.extendedDatasets.createPast(1, {
        accessFilter: null,
        properties: [{ name: 'city' }]
      });
      return mockHttp()
        .mount(DatasetOwnerOnly, mountOptions())
        .complete()
        .request(async (component) => {
          await component.get('input[value="property"]').setChecked();
          await component.get('select').findAll('option')[1].setSelected();
          await component.findAll('select')[1].findAll('option')[1].setSelected();
          await component.get('#property-filter-form').trigger('submit');
        })
        .respondWithData(() =>
          testData.extendedDatasets.update(-1, {
            accessFilter: {
              type: 'property',
              rules: [{ datasetProperty: 'city', actorProperty: 'region' }]
            }
          }))
        .afterResponse(component => {
          component.should.alert('success', (message) => {
            message.should.endWith('will now only have access to Entities matching the filter rule.');
          });
        });
    });

    it('shows a CTA to undo', () => {
      testData.actorProperties.createPast(1, { name: 'region' });
      testData.extendedDatasets.createPast(1, {
        accessFilter: { type: 'ownerOnly' },
        properties: [{ name: 'city' }]
      });
      return mockHttp()
        .mount(DatasetOwnerOnly, mountOptions())
        .complete()
        .request(async (component) => {
          await component.get('input[value="all"]').setChecked();
          await component.get('.modal-actions .btn-primary').trigger('click');
        })
        .respondWithData(() =>
          testData.extendedDatasets.update(-1, { accessFilter: null }))
        .complete()
        .request(component => {
          const { alert } = component.vm.$container;
          alert.cta.text.should.equal('Undo');
          return alert.cta.handler();
        })
        .beforeAnyResponse(component => {
          const inputs = component.findAll('input[type="radio"]');
          for (const input of inputs) input.element.disabled.should.be.true;
          inputs.map(input => input.element.checked).should.eql([true, false, false]);
        })
        .respondWithData(() =>
          testData.extendedDatasets.update(-1, { accessFilter: { type: 'ownerOnly' } }))
        .testRequests([{
          method: 'PATCH',
          url: '/v1/projects/1/datasets/trees',
          data: { accessFilter: { type: 'ownerOnly' } }
        }])
        .afterResponse(component => {
          const inputs = component.findAll('input[type="radio"]');
          for (const input of inputs) input.element.disabled.should.be.false;
          inputs.map(input => input.element.checked).should.eql([false, true, false]);
        });
    });
  });

  describe('Filter by Property disabled state', () => {
    it('disables "Filter by Property" when no dataset properties exist', async () => {
      testData.extendedDatasets.createPast(1, { accessFilter: null, properties: [] });
      const component = await mountComponent();
      const propertyInput = component.get('input[value="property"]');
      propertyInput.element.disabled.should.be.true;
    });

    it('disables "Filter by Property" when no actor properties exist', async () => {
      testData.extendedDatasets.createPast(1, {
        accessFilter: null,
        properties: [{ name: 'city' }]
      });
      const component = mountComponent();
      const propertyInput = component.get('input[value="property"]');
      propertyInput.element.disabled.should.be.true;
    });
  });

  it('displays the current filter rule when accessFilter type is property', async () => {
    testData.extendedDatasets.createPast(1, {
      accessFilter: {
        type: 'property',
        rules: [{ datasetProperty: 'city', actorProperty: 'region' }]
      },
      properties: [{ name: 'city' }]
    });
    const component = await mountComponent();
    const ruleText = component.get('.current-filter-rule').text();
    ruleText.should.startWith('Rule: city (Entity property) = region (User property)');
  });

  it('remembers the new setting', () => {
    mockLogin();
    testData.extendedDatasets.createPast(1, { accessFilter: { type: 'ownerOnly' } });
    return load('/projects/1/entity-lists/trees/settings')
      .complete()
      .request(async (app) => {
        const component = app.getComponent(DatasetOwnerOnly);
        await component.get('input[value="all"]').setChecked();
        await component.get('.btn-primary').trigger('click');
      })
      .respondWithData(() =>
        testData.extendedDatasets.update(-1, { accessFilter: null }))
      .complete()
      .route('/projects/1/entity-lists/trees/properties')
      .complete()
      .route('/projects/1/entity-lists/trees/settings')
      .then(app => {
        const component = app.getComponent(DatasetOwnerOnly);
        component.get('input[value="all"]').element.checked.should.be.true;
      });
  });
});
