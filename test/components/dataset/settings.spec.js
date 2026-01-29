import DatasetDelete from '../../../src/components/dataset/delete.vue';
import DatasetPendingSubmissions from '../../../src/components/dataset/pending-submissions.vue';

import testData from '../../data';
import { load, mockHttp } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('DatasetSettings', () => {
  beforeEach(mockLogin);

  it('should have onReceipt selected', async () => {
    testData.extendedDatasets.createPast(1);
    const component = await load('/projects/1/entity-lists/trees/settings');
    component.get('input[value="true"]').element.checked.should.be.false;
    component.get('input[value="false"]').element.checked.should.be.true;
  });

  it('should have onApproval selected', async () => {
    testData.extendedDatasets.createPast(1, { approvalRequired: true });
    const component = await load('/projects/1/entity-lists/trees/settings');
    component.get('input[value="true"]').element.checked.should.be.true;
    component.get('input[value="false"]').element.checked.should.be.false;
  });

  it('should sends the correct request - true', async () => {
    testData.extendedDatasets.createPast(1);
    await load('/projects/1/entity-lists/trees/settings', { root: false })
      .complete()
      .request(async (component) => component.get('input[value="true"]').setValue(true))
      .beforeEachResponse((_, { method, url, data }) => {
        method.should.equal('PATCH');
        url.should.equal('/v1/projects/1/datasets/trees');
        data.should.eql({ approvalRequired: true });
      })
      .respondWithProblem();
  });

  it('should sends the correct request - false', async () => {
    testData.extendedDatasets.createPast(1, { approvalRequired: true });
    await load('/projects/1/entity-lists/trees/settings', { root: false })
      .complete()
      .request(async (component) => component.get('input[value="false"]').setValue(true))
      .beforeEachResponse((_, { method, url, data }) => {
        method.should.equal('PATCH');
        url.should.equal('/v1/projects/1/datasets/trees');
        data.should.eql({ approvalRequired: false });
      })
      .respondWithProblem();
  });

  it('should change approvalRequired to true', async () => {
    testData.extendedDatasets.createPast(1);
    await load('/projects/1/entity-lists/trees/settings', { root: false })
      .complete()
      .request(async (component) => component.get('input[value="true"]').setValue(true))
      .respondWithData(() => testData.extendedDatasets.last())
      .then((component) => {
        component.get('input[value="true"]').element.checked.should.be.true;
        component.get('input[value="false"]').element.checked.should.be.false;
        component.should.alert('success');
      });
  });

  it('should revert approvalRequired flag if modal is cancelled', async () => {
    testData.extendedDatasets.createPast(1, { approvalRequired: true });
    await load('/projects/1/entity-lists/trees/settings', { root: false })
      .complete()
      .request(async (component) => component.get('input[value="false"]').setValue(true))
      .respondWithProblem({
        code: 400.29,
        message: 'There are 10 pending submissions',
        details: { count: 10 }
      })
      .then(async (component) => {
        const modal = component.getComponent(DatasetPendingSubmissions);
        modal.props().state.should.be.true;
        await modal.get('.btn-link').trigger('click');
        modal.props().state.should.be.false;
        component.get('input[value="true"]').element.checked.should.be.true;
      });
  });

  it('should revert approvalRequired flag there is an error', async () => {
    testData.extendedDatasets.createPast(1, { approvalRequired: true });
    await load('/projects/1/entity-lists/trees/settings', { root: false })
      .complete()
      .request(async (component) => component.get('input[value="false"]').setValue(true))
      .respondWithProblem(500)
      .then(async (component) => {
        component.should.alert('danger');
        component.get('input[value="true"]').element.checked.should.be.true;
      });
  });

  it('should send correct convert query param', async () => {
    testData.extendedDatasets.createPast(1, { approvalRequired: true });
    await load('/projects/1/entity-lists/trees/settings', { root: false })
      .complete()
      .request(async (component) => component.get('input[value="false"]').setValue(true))
      .respondWithProblem({
        code: 400.29,
        message: 'There are 10 pending submissions',
        details: { count: 10 }
      })
      .complete()
      .request(async (component) => {
        const modal = component.getComponent(DatasetPendingSubmissions);
        modal.text().should.match(/10 pending records/);
        await modal.get('input[value="true"]').setValue(true);
        return modal.get('.btn-danger').trigger('click');
      })
      .beforeEachResponse((_, { method, url, data }) => {
        method.should.equal('PATCH');
        url.should.equal('/v1/projects/1/datasets/trees?convert=true');
        data.should.eql({ approvalRequired: false });
      })
      .respondWithData(() => testData.extendedDatasets.update(-1, { approvalRequired: false }))
      .then(async (component) => {
        const modal = component.getComponent(DatasetPendingSubmissions);
        modal.props().state.should.be.false;
        component.get('input[value="false"]').element.checked.should.be.true;
      });
  });

  describe('DatasetDelete', () => {
    it('toggles the modal', () => {
      testData.extendedDatasets.createPast(1);
      return load('/projects/1/entity-lists/trees/settings', { root: false })
        .testModalToggles({
          modal: DatasetDelete,
          show: '#dataset-settings .panel-simple-danger .btn-danger',
          hide: '.btn-link'
        });
    });

    describe('dependent forms', () => {
      it('shows help text if there are dependent forms', async () => {
        testData.extendedDatasets.createPast(1, {
          sourceForms: [{ xmlFormId: 'f1', name: 'Form 1' }],
          linkedForms: [{ xmlFormId: 'f2', name: 'Form 2' }]
        });
        const component = await load('/projects/1/entity-lists/trees/settings');
        const help = component.get('.dependent-forms-help');
        help.text().should.match(/2 Forms/);
      });

      it('does not show help text if there are no dependent forms', async () => {
        testData.extendedDatasets.createPast(1, {
          sourceForms: [],
          linkedForms: []
        });
        const component = await load('/projects/1/entity-lists/trees/settings');
        component.find('.dependent-forms-help').exists().should.be.false;
      });

      it('disables delete button if there are dependent forms', async () => {
        testData.extendedDatasets.createPast(1, {
          sourceForms: [{ xmlFormId: 'f1', name: 'Form 1' }]
        });
        const component = await load('/projects/1/entity-lists/trees/settings');
        const button = component.get('#dataset-settings .panel-simple-danger .btn-danger');
        button.attributes('aria-disabled').should.equal('true');
      });

      it('enables delete button if there are no dependent forms', async () => {
        testData.extendedDatasets.createPast(1, {
          sourceForms: [],
          linkedForms: []
        });
        const component = await load('/projects/1/entity-lists/trees/settings');
        const button = component.get('#dataset-settings .panel-simple-danger .btn-danger');
        button.attributes('aria-disabled').should.equal('false');
      });
    });

    it('implements some standard button things', () => {
      testData.extendedDatasets.createPast(1);
      return mockHttp()
        .mount(DatasetDelete, {
          props: { state: true },
          container: {
            requestData: { dataset: testData.extendedDatasets.last() }
          }
        })
        .testStandardButton({
          button: '.btn-danger',
          disabled: ['.btn-link'],
          modal: true
        });
    });

    describe('after a successful response', () => {
      const del = () => {
        testData.extendedDatasets.createPast(1);
        return load('/projects/1/entity-lists/trees/settings')
          .complete()
          .request(async (app) => {
            await app.get('#dataset-settings .panel-simple-danger .btn-danger').trigger('click');
            return app.get('#dataset-delete .btn-danger').trigger('click');
          })
          .respondWithData(() => {
            testData.extendedDatasets.splice(0, 1);
            return { success: true };
          })
          .respondWithData(() => testData.extendedDatasets.sorted())
          .respondWithData(() => []); // Empty list of deleted dataset
      };

      it('navigates to the entity-lists page', async () => {
        const app = await del();
        app.vm.$route.path.should.equal('/projects/1/entity-lists');
      });

      it('shows a success message', async () => {
        const app = await del();
        app.should.alert('success');
      });

      it('decreases the dataset count', () =>
        del().beforeEachResponse((app, _, i) => {
          if (i === 0) return;
          app.get('#page-head-tabs li.active .badge').text().should.equal('0');
        }));
    });
  });
});
