import DatasetOwnerOnly from '../../../src/components/dataset/owner-only.vue';
import Modal from '../../../src/components/modal.vue';

import testData from '../../data';
import { load, mockHttp } from '../../util/http';
import { mockLogin } from '../../util/session';
import { mount } from '../../util/lifecycle';

const mountOptions = () => ({
  container: {
    requestData: { dataset: testData.extendedDatasets.last() }
  }
});
const mountComponent = () => mount(DatasetOwnerOnly, mountOptions());

describe('DatasetOwnerOnly', () => {
  describe('modal text', () => {
    it('shows the correct modal after false is selected', async () => {
      testData.extendedDatasets.createPast(1, { ownerOnly: true });
      const component = mountComponent();
      await component.get('input').setChecked();
      component.getComponent(Modal).props().state.should.be.true;
      component.get('.modal-title').text().should.equal('Access all Entities');
      const introduction = component.get('.modal-introduction').text();
      introduction.should.startWith('App Users and Data Collectors will have access to all Entities,');
      const buttonText = component.get('.modal-actions .btn-primary').text();
      buttonText.should.equal('Access all Entities');
    });

    it('shows the correct modal after true is selected', async () => {
      testData.extendedDatasets.createPast(1, { ownerOnly: false });
      const component = mountComponent();
      await component.get('.radio + .radio input').setChecked();
      component.getComponent(Modal).props().state.should.be.true;
      const title = component.get('.modal-title').text();
      title.should.equal('Only access own Entities');
      const introduction = component.get('.modal-introduction').text();
      introduction.should.startWith('App Users and Data Collectors will lose access to the Entities they have not created.');
      const buttonText = component.get('.modal-actions .btn-primary').text();
      buttonText.should.equal('Access own Entities');
    });
  });

  describe('canceling', () => {
    for (const selector of ['.close', '.btn-link']) {
      it(`it cancels after ${selector} is clicked`, async () => {
        testData.extendedDatasets.createPast(1, { ownerOnly: true });
        const component = mountComponent();
        const inputs = component.findAll('input');
        const checked = () => inputs.map(input => input.element.checked);

        // Initial state
        component.getComponent(Modal).props().state.should.be.false;
        checked().should.eql([false, true]);

        // Changing the selection
        await inputs[0].setChecked();
        component.getComponent(Modal).props().state.should.be.true;
        checked().should.eql([true, false]);

        // Canceling
        await component.getComponent(Modal).get(selector).trigger('click');
        component.getComponent(Modal).props().state.should.be.false;
        checked().should.eql([false, true]);
      });
    }
  });

  it('sends the correct request', () => {
    testData.extendedDatasets.createPast(1, { ownerOnly: true });
    return mockHttp()
      .mount(DatasetOwnerOnly, mountOptions())
      .request(async (component) => {
        await component.get('input').setChecked();
        await component.get('.modal-actions .btn-primary').trigger('click');
      })
      .respondWithProblem()
      .testRequests([{
        method: 'PATCH',
        url: '/v1/projects/1/datasets/trees',
        data: { ownerOnly: false }
      }]);
  });

  it('implements some standard button things', async () => {
    testData.extendedDatasets.createPast(1, { ownerOnly: true });
    return mockHttp()
      .mount(DatasetOwnerOnly, mountOptions())
      .afterResponses(component => component.get('input').setChecked())
      .testStandardButton({
        button: '.modal-actions .btn-primary',
        disabled: ['.modal-actions .btn-link'],
        modal: Modal
      });
  });

  describe('alert', () => {
    it('shows the correct text once ownerOnly has been changed to false', () => {
      testData.extendedDatasets.createPast(1, { ownerOnly: true });
      return mockHttp()
        .mount(DatasetOwnerOnly, mountOptions())
        .request(async (component) => {
          await component.get('input').setChecked();
          await component.get('.modal-actions .btn-primary').trigger('click');
        })
        .respondWithData(() =>
          testData.extendedDatasets.update(-1, { ownerOnly: false }))
        .afterResponse(component => {
          component.should.alert('success', (message) => {
            message.should.endWith('will now have access to all Entities.');
          });
        });
    });

    it('shows the correct text once ownerOnly has been changed to true', () => {
      testData.extendedDatasets.createPast(1, { ownerOnly: false });
      return mockHttp()
        .mount(DatasetOwnerOnly, mountOptions())
        .request(async (component) => {
          await component.get('.radio + .radio input').setChecked();
          await component.get('.modal-actions .btn-primary').trigger('click');
        })
        .respondWithData(() =>
          testData.extendedDatasets.update(-1, { ownerOnly: true }))
        .afterResponse(component => {
          component.should.alert('success', (message) => {
            message.should.endWith('will now only have access to Entities they create.');
          });
        });
    });

    it('shows a CTA to undo', () => {
      testData.extendedDatasets.createPast(1, { ownerOnly: true });
      return mockHttp()
        .mount(DatasetOwnerOnly, mountOptions())
        .request(async (component) => {
          await component.get('input').setChecked();
          await component.get('.modal-actions .btn-primary').trigger('click');
        })
        .respondWithData(() =>
          testData.extendedDatasets.update(-1, { ownerOnly: false }))
        .complete()
        .request(component => {
          const { alert } = component.vm.$container;
          alert.ctaText.should.equal('Undo');
          return alert.ctaHandler();
        })
        .beforeAnyResponse(component => {
          const inputs = component.findAll('input');
          for (const input of component.findAll('input'))
            input.element.disabled.should.be.true;
          inputs.map(input => input.element.checked).should.eql([true, false]);
        })
        .respondWithData(() =>
          testData.extendedDatasets.update(-1, { ownerOnly: true }))
        .testRequests([{
          method: 'PATCH',
          url: '/v1/projects/1/datasets/trees',
          data: { ownerOnly: true }
        }])
        .afterResponse(component => {
          const inputs = component.findAll('input');
          for (const input of component.findAll('input'))
            input.element.disabled.should.be.false;
          inputs.map(input => input.element.checked).should.eql([false, true]);
        });
    });
  });

  it('remembers the new setting', () => {
    mockLogin();
    testData.extendedDatasets.createPast(1, { ownerOnly: true });
    return load('/projects/1/entity-lists/trees/settings')
      .complete()
      .request(async (app) => {
        const component = app.getComponent(DatasetOwnerOnly);
        await component.get('input').setChecked();
        await component.get('.btn-primary').trigger('click');
      })
      .respondWithData(() =>
        testData.extendedDatasets.update(-1, { ownerOnly: false }))
      .complete()
      .route('/projects/1/entity-lists/trees/properties')
      .complete()
      .route('/projects/1/entity-lists/trees/settings')
      .then(app => {
        const component = app.getComponent(DatasetOwnerOnly);
        component.get('input').element.checked.should.be.true;
      });
  });
});
