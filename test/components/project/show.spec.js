import Loading from '../../../lib/components/loading.vue';
import testData from '../../data';
import { mockLogin } from '../../session';
import { mockRoute } from '../../http';

describe('ProjectShow', () => {
  beforeEach(mockLogin);

  it('shows a loading message until all responses are returned', () =>
    mockRoute('/projects/1')
      .beforeEachResponse((app, config, index) => {
        const loading = app.find(Loading);
        loading.length.should.equal(3);
        // ProjectShow
        loading[0].getProp('state').should.equal(index === 0);
        // "Right Now" section
        loading[1].getProp('state').should.equal(true);
        // Forms section
        loading[2].getProp('state').should.equal(true);
      })
      .respondWithData(() => testData.extendedProjects.createPast(1).last())
      .respondWithData(() => testData.extendedForms.createPast(1).sorted())
      .afterResponses(app => {
        const loading = app.find(Loading);
        const states = loading.map(component => component.getProp('state'));
        states.should.eql([false, false, false]);
      }));
});
