import Loading from '../../../lib/components/loading.vue';
import testData from '../../data';
import { mockLogin } from '../../session';
import { mockRoute } from '../../http';

describe('FormShow', () => {
  beforeEach(mockLogin);

  it('shows a loading message until all responses are returned', () =>
    mockRoute('/projects/1/forms/x/media-files')
      .beforeEachResponse(app => {
        const components = app.find(Loading);
        const states = components.map(component => component.getProp('state'));
        states.should.eql([true]);
      })
      .respondWithData(() => testData.simpleProjects.createPast(1).last())
      .respondWithData(() =>
        testData.extendedForms.createPast(1, { xmlFormId: 'x' }).last())
      .respondWithData(() =>
        testData.extendedFormAttachments.createPast(1).sorted())
      .afterResponses(app => {
        const components = app.find(Loading);
        const states = components.map(component => component.getProp('state'));
        states.should.eql([false]);
      }));
});
