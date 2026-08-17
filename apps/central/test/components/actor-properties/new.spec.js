import ActorPropertiesNew from '../../../src/components/actor-properties/new.vue';

import testData from '../../data';
import { mockHttp } from '../../util/http';
import { mergeMountOptions, mount } from '../../util/lifecycle';
import { mockLogin } from '../../util/session';
import { testRequestData } from '../../util/request-data';

const mountComponent = (options = undefined) =>
  mount(ActorPropertiesNew, mergeMountOptions(options, {
    container: {
      requestData: testRequestData(['actorProperties'], {
        project: testData.extendedProjects.last(),
        actorProperties: testData.actorProperties.sorted()
      })
    }
  }));

describe('ActorPropertiesNew', () => {
  beforeEach(() => {
    mockLogin();
    testData.extendedProjects.createPast(1);
  });

  it('shows the + Add Property link by default', () => {
    const component = mountComponent();
    component.find('.add-property-link').exists().should.be.true;
    component.find('input').exists().should.be.false;
  });

  it('shows the form when the link is clicked', async () => {
    const component = mountComponent();
    await component.find('.add-property-link').trigger('click');
    component.find('input').exists().should.be.true;
    component.find('button[type="submit"]').text().should.equal('Add');
    component.find('button[type="button"]').text().should.equal('Cancel');
    component.find('.add-property-link').exists().should.be.false;
  });

  it('focuses the input when the link is clicked', async () => {
    const component = mountComponent({ attachTo: document.body });
    await component.find('.add-property-link').trigger('click');
    await component.vm.$nextTick();
    component.find('input').should.be.focused();
  });

  it('hides the form and restores the link on cancel', async () => {
    const component = mountComponent();
    await component.find('.add-property-link').trigger('click');
    await component.find('button[type="button"]').trigger('click');
    component.find('input').exists().should.be.false;
    component.find('.add-property-link').exists().should.be.true;
  });

  it('sends the correct POST request', () => mockHttp()
    .mount(ActorPropertiesNew, mergeMountOptions({}, {
      container: {
        requestData: testRequestData(['actorProperties'], {
          project: testData.extendedProjects.last(),
          actorProperties: testData.actorProperties.sorted()
        })
      }
    }))
    .request(async (component) => {
      await component.find('.add-property-link').trigger('click');
      await component.get('input').setValue('region');
      return component.get('form').trigger('submit');
    })
    .beforeEachResponse((_, { method, url, data }) => {
      method.should.equal('POST');
      url.should.equal('/v1/projects/1/actor-properties');
      data.should.eql({ name: 'region' });
    })
    .respondWithSuccess());

  it('emits success and restores the link after a successful POST', async () => {
    testData.actorProperties.createPast(1, { name: 'region' });
    return mockHttp()
      .mount(ActorPropertiesNew, mergeMountOptions({}, {
        container: {
          requestData: testRequestData(['actorProperties'], {
            project: testData.extendedProjects.last(),
            actorProperties: testData.actorProperties.sorted()
          })
        }
      }))
      .request(async (component) => {
        await component.find('.add-property-link').trigger('click');
        await component.get('input').setValue('newprop');
        return component.get('form').trigger('submit');
      })
      .respondWithSuccess()
      .afterResponse((component) => {
        component.emitted('success').should.have.length(1);
        component.find('.add-property-link').exists().should.be.true;
        component.find('input').exists().should.be.false;
      });
  });

  it('adds the new property to actorProperties.data after a successful POST', () => mockHttp()
    .mount(ActorPropertiesNew, mergeMountOptions({}, {
      container: {
        requestData: testRequestData(['actorProperties'], {
          project: testData.extendedProjects.last(),
          actorProperties: testData.actorProperties.sorted()
        })
      }
    }))
    .request(async (component) => {
      await component.find('.add-property-link').trigger('click');
      await component.get('input').setValue('region');
      return component.get('form').trigger('submit');
    })
    .respondWithSuccess()
    .afterResponse((component) => {
      const { actorProperties } = component.vm.$container.requestData.localResources;
      actorProperties.data.should.deep.include({ name: 'region' });
    }));

  it('shows an alert on a 409.3 duplicate name conflict', () => mockHttp()
    .mount(ActorPropertiesNew, mergeMountOptions({}, {
      container: {
        requestData: testRequestData(['actorProperties'], {
          project: testData.extendedProjects.last(),
          actorProperties: testData.actorProperties.sorted()
        })
      }
    }))
    .request(async (component) => {
      await component.find('.add-property-link').trigger('click');
      await component.get('input').setValue('region');
      return component.get('form').trigger('submit');
    })
    .respondWithProblem({
      code: 409.3,
      message: 'Unique constraint violation',
      details: { fields: ['projectId', 'name'], values: ['1', 'region'] }
    })
    .afterResponse((component) => {
      component.should.alert('danger', /region/);
    }));

  it('disables the Add and Cancel buttons while the request is in flight', () => mockHttp()
    .mount(ActorPropertiesNew, mergeMountOptions({}, {
      container: {
        requestData: testRequestData(['actorProperties'], {
          project: testData.extendedProjects.last(),
          actorProperties: testData.actorProperties.sorted()
        })
      }
    }))
    .request(async (component) => {
      await component.find('.add-property-link').trigger('click');
      await component.get('input').setValue('region');
      return component.get('form').trigger('submit');
    })
    .beforeEachResponse((component) => {
      component.get('button[type="submit"]').attributes('aria-disabled').should.equal('true');
      component.get('button[type="button"]').attributes('aria-disabled').should.equal('true');
    })
    .respondWithSuccess());
});
