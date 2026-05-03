import DatasetDelete from '../../../src/components/dataset/delete.vue';

import testData from '../../data';
import { load, mockHttp } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('DatasetDelete', () => {
  beforeEach(mockLogin);

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
