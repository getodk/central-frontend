import DateTime from '../../../src/components/date-time.vue';
import DlData from '../../../src/components/dl-data.vue';
import EntityMapPopup from '../../../src/components/entity/map-popup.vue';

import testData from '../../data';
import { mergeMountOptions } from '../../util/lifecycle';
import { mockHttp } from '../../util/http';
import { mockLogin } from '../../util/session';
import { mockRouter } from '../../util/router';

const mountOptions = (options = undefined) => {
  const project = testData.extendedProjects.last();
  const projectId = project.id.toString();
  const dataset = testData.extendedDatasets.last();
  const encodedDataset = encodeURIComponent(dataset.name);
  return mergeMountOptions(options, {
    global: {
      provide: { projectId, datasetName: dataset.name }
    },
    container: {
      router: mockRouter(`/projects/${projectId}/entity-lists/${encodedDataset}/entities?map=true`),
      requestData: { project, dataset }
    }
  });
};
const requestEntity = (series) => series
  .request(component => component.setProps({
    uuid: testData.extendedEntities.last().uuid
  }))
  .respondWithData(() => testData.entityOData(1));

describe('EntityMapPopup', () => {
  beforeEach(() => {
    mockLogin({ displayName: 'Allison' });
    testData.extendedDatasets.createPast(1, {
      name: 'á',
      properties: [
        { name: 'height' },
        { name: 'circumference.cm', odataName: 'circumference_cm' },
        { name: 'geometry' },
        { name: 'one_more' }
      ],
      entities: 1
    });
    testData.extendedEntities.createPast(1, {
      uuid: 'e',
      label: 'Dogwood',
      data: {
        height: '1',
        'circumference.cm': '2',
        geometry: 'POINT (3 3)',
        one_more: null
      }
    });
  });

  it('does nothing if uuid is not defined', () =>
    mockHttp()
      .mount(EntityMapPopup, mountOptions())
      .testNoRequest()
      .afterResponses(component => {
        component.should.be.hidden();
      }));

  it('sends the correct request', () =>
    mockHttp()
      .mount(EntityMapPopup, mountOptions())
      .modify(requestEntity)
      .testRequests([{
        url: ({ pathname, searchParams }) => {
          pathname.should.equal('/v1/projects/1/datasets/%C3%A1.svc/Entities');
          searchParams.get('$filter').should.equal("__id eq 'e'");
        }
      }]));

  describe('unexpected responses', () => {
    it('handles an error response', () =>
      mockHttp()
        .mount(EntityMapPopup, mountOptions())
        .request(component => component.setProps({ uuid: 'e' }))
        .respondWithProblem({ code: 500.1, message: 'Oh no' })
        .afterResponse(component => {
          component.should.redAlert('Oh no');
          component.emitted().hide.should.eql([[]]);
        }));

    it('handles empty OData', () =>
      mockHttp()
        .mount(EntityMapPopup, mountOptions())
        .modify(requestEntity)
        .beforeAnyResponse(() => {
          testData.extendedEntities.splice(0);
        })
        .afterResponse(component => {
          component.should.redAlert(message => {
            message.should.startWith('The resource you are looking for cannot be found.');
          });
          component.emitted().hide.should.eql([[]]);
        }));
  });

  it('shows the entity label in the title', () =>
    mockHttp()
      .mount(EntityMapPopup, mountOptions())
      .modify(requestEntity)
      .afterResponse(async (component) => {
        const span = component.get('.map-popup-title span');
        span.text().should.equal('Dogwood');
        await span.should.have.textTooltip();
      }));

  it('shows entity metadata', () =>
    mockHttp()
      .mount(EntityMapPopup, mountOptions())
      .modify(requestEntity)
      .afterResponse(async (component) => {
        const dd = component.findAll('dd');
        dd.length.should.be.above(2);

        dd[0].text().should.equal('Allison');
        await dd[0].should.have.textTooltip();

        const { createdAt } = testData.extendedEntities.last();
        dd[1].getComponent(DateTime).props().iso.should.equal(createdAt);
      }));

  it('shows property data', () =>
    mockHttp()
      .mount(EntityMapPopup, mountOptions())
      .modify(requestEntity)
      .afterResponse(async (component) => {
        // Pairs of <dt> and <dd> elements
        const pairs = component.findAllComponents(DlData);
        pairs.map(pair => [pair.props().name, pair.props().value]).should.eql([
          ['height', '1'],
          // The actual property name is shown, not the property's OData name.
          ['circumference.cm', '2'],
          ['geometry', 'POINT (3 3)'],
          ['one_more', null]
        ]);
      }));

  it('updates after the uuid changes', () =>
    mockHttp()
      .mount(EntityMapPopup, mountOptions())
      .modify(requestEntity)
      .afterResponse(() => {
        testData.extendedEntities.createNew({
          uuid: 'e2',
          label: 'Elm',
          data: { geometry: 'POINT (4 4)' }
        });
      })
      .modify(requestEntity)
      .testRequests([{
        url: ({ searchParams }) => {
          searchParams.get('$filter').should.equal("__id eq 'e2'");
        }
      }])
      .afterResponse(component => {
        component.get('.map-popup-title').text().should.equal('Elm');
        const { value } = component.findAllComponents(DlData)[2].props();
        value.should.equal('POINT (4 4)');
      }));
});
