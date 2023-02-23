import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';


describe('DatasetEntities', () => {
  beforeEach(mockLogin);

  it('shows the download button', async () => {
    testData.extendedDatasets.createPast(1, { name: 'trees' });
    testData.extendedEntities.createPast(10);
    const component = await load(
      '/projects/1/datasets/trees/entities',
      { root: false }
    );
    const text = component.get('#entity-download-button').text();
    text.should.equal('Download');
  });
});
