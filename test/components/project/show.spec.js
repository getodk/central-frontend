import Loading from '../../../lib/components/loading.vue';
import testData from '../../data';
import { mockLogin } from '../../session';
import { mockRoute } from '../../http';

describe('ProjectShow', () => {
  beforeEach(mockLogin);

  it('shows a loading message until all responses are returned', () =>
    mockRoute('/projects/1')
      .beforeEachResponse(app => {
        const components = app.find(Loading);
        const states = components.map(component => component.getProp('state'));
        states.should.eql([true, true]);
      })
      .respondWithData(() => testData.simpleProjects.createPast(1).last())
      .respondWithData(() => testData.extendedForms.createPast(1).sorted())
      .afterResponses(app => {
        const components = app.find(Loading);
        const states = components.map(component => component.getProp('state'));
        states.should.eql([false, false]);
      }));
});
