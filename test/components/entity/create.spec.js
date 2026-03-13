import EntityCreate from '../../../src/components/entity/create.vue';

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

  it('does not send empty data values', () => {
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
